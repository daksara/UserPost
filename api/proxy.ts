// api/proxy.ts — Vercel Edge Function.
//
// Proxy transparan ke Groq/Gemini yang menyisipkan API key dari env server,
// sehingga key tidak pernah dikirim ke browser. Aktif saat frontend dibuild
// dengan VITE_USE_PROXY=1. Set env server: GROQ_API_KEY dan/atau GEMINI_API_KEY.
//
// Pengamanan (agar tidak jadi open relay yang menghabiskan kuota key-mu):
//  - Hanya menerima POST.
//  - Origin browser harus sama dengan origin deploy, atau masuk daftar
//    ALLOWED_ORIGINS (dipisah koma). Mencegah situs lain memanggil proxy ini.
//  - Hanya path yang masuk allow-list (daftar model + chat) yang diteruskan.
//  - Rate-limit per-IP (opsional) lewat Upstash Redis. Aktif hanya bila
//    UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN diset; selain itu
//    dilewati (fail-open) agar app tetap jalan tanpa konfigurasi tambahan.
//
// Body request (dari src/ai/providers.ts):
//   { provider: 'groq'|'gemini', path: string, method: 'GET'|'POST', body?: unknown }
// Respons upstream (JSON daftar model atau aliran SSE chat) diteruskan apa adanya.

export const config = { runtime: 'edge' }

// Edge runtime menyediakan `process.env` saat jalan, tapi tipe Node tidak
// dipasang (dan tidak pas untuk edge). Deklarasikan minimal agar typecheck
// deploy lolos tanpa menarik @types/node.
declare const process: { env: Record<string, string | undefined> }

const BASES: Record<string, string> = {
  groq: 'https://api.groq.com/openai/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
}

// Allow-list path per provider (query string diabaikan saat dicocokkan).
// Hanya endpoint daftar model & chat yang boleh diteruskan.
const ALLOWED: Record<string, RegExp[]> = {
  groq: [/^models$/, /^chat\/completions$/],
  gemini: [/^models$/, /^models\/[^/]+:(streamGenerateContent|generateContent)$/],
}

/** True bila `path` (boleh berisi query) diizinkan untuk `provider`. Murni & dapat diuji. */
export function isAllowedPath(provider: string, path: string): boolean {
  const clean = String(path).replace(/^\/+/, '').split('?')[0]
  if (clean.includes('..') || clean.includes('://')) return false
  return (ALLOWED[provider] ?? []).some((re) => re.test(clean))
}

/** Kunci jendela rate-limit (fixed window) untuk sebuah IP. Murni & dapat diuji. */
export function rlWindowKey(ip: string, nowMs: number, windowSec: number): string {
  return `rl:${ip}:${Math.floor(nowMs / 1000 / windowSec)}`
}

/** True bila body request melebihi `maxBytes` (perkiraan dari panjang JSON). Murni & dapat diuji. */
export function bodyTooLarge(body: unknown, maxBytes: number): boolean {
  if (body == null) return false
  try {
    return JSON.stringify(body).length > maxBytes
  } catch {
    return true
  }
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Origin browser harus cocok dengan origin deploy, atau salah satu di
// ALLOWED_ORIGINS. Request tanpa header Origin (mis. server-to-server) dibiarkan
// lewat — perlindungan utama tetap allow-list path + key yang hanya ada di server.
function originAllowed(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true
  const configured = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (configured.length) return configured.includes(origin)
  try {
    return origin === new URL(req.url).origin
  } catch {
    return false
  }
}

// Rate-limit per-IP via Upstash Redis REST. Fail-open: bila belum dikonfigurasi
// atau Redis error, kembalikan false (tidak memblokir) agar UX tidak rusak.
async function rateLimited(req: Request): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return false

  const windowSec = Number(process.env.RL_WINDOW || '60')
  const limit = Number(process.env.RL_MAX || '30')
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
  const key = rlWindowKey(ip, Date.now(), windowSec)
  const headers = { Authorization: `Bearer ${token}` }

  try {
    const res = await fetch(`${url}/incr/${encodeURIComponent(key)}`, { headers })
    const count = Number((await res.json())?.result)
    if (count === 1) {
      // Pasang TTL hanya saat hit pertama di jendela ini.
      await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSec}`, { headers })
    }
    return Number.isFinite(count) && count > limit
  } catch {
    return false
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!originAllowed(req)) return json({ error: 'Origin tidak diizinkan' }, 403)
  if (await rateLimited(req)) {
    return json({ error: 'Terlalu banyak permintaan. Coba lagi sebentar.' }, 429)
  }

  let payload: { provider?: string; path?: string; method?: string; body?: unknown }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Body bukan JSON valid' }, 400)
  }

  const provider = payload.provider ?? ''
  if (provider !== 'groq' && provider !== 'gemini') {
    return json({ error: `Provider tidak dikenal: ${provider}` }, 400)
  }

  const path = String(payload.path ?? '')
  if (!isAllowedPath(provider, path)) {
    return json({ error: 'Path tidak diizinkan' }, 400)
  }

  const maxBody = Number(process.env.MAX_BODY_BYTES || '262144')
  if (bodyTooLarge(payload.body, maxBody)) {
    return json({ error: 'Body terlalu besar.' }, 413)
  }

  const key = provider === 'groq' ? process.env.GROQ_API_KEY : process.env.GEMINI_API_KEY
  if (!key) {
    return json({ error: `Server belum dikonfigurasi: ${provider.toUpperCase()}_API_KEY kosong.` }, 500)
  }

  const cleanPath = path.replace(/^\/+/, '')
  const method = payload.method === 'POST' ? 'POST' : 'GET'
  let url = `${BASES[provider]}/${cleanPath}`
  const headers: Record<string, string> = {}
  if (method === 'POST') headers['Content-Type'] = 'application/json'
  if (provider === 'groq') {
    headers['Authorization'] = `Bearer ${key}`
  } else {
    url += `${cleanPath.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`
  }

  let upstream: Response
  try {
    upstream = await fetch(url, {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify(payload.body ?? {}) : undefined,
    })
  } catch (e) {
    return json({ error: `Gagal menghubungi ${provider}: ${(e as Error).message}` }, 502)
  }

  // Teruskan apa adanya — JSON (daftar model) maupun SSE (chat streaming).
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
