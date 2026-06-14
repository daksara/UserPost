// api/proxy.ts — Vercel Edge Function.
//
// Proxy transparan ke Groq/Gemini yang menyisipkan API key dari env server,
// sehingga key tidak pernah dikirim ke browser. Aktif saat frontend dibuild
// dengan VITE_USE_PROXY=1. Set env server: GROQ_API_KEY dan/atau GEMINI_API_KEY.
//
// Body request (dari src/ai/providers.ts):
//   { provider: 'groq'|'gemini', path: string, method: 'GET'|'POST', body?: unknown }
// Respons upstream (JSON daftar model atau aliran SSE chat) diteruskan apa adanya.

export const config = { runtime: 'edge' }

const BASES: Record<string, string> = {
  groq: 'https://api.groq.com/openai/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

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

  const key = provider === 'groq' ? process.env.GROQ_API_KEY : process.env.GEMINI_API_KEY
  if (!key) {
    return json({ error: `Server belum dikonfigurasi: ${provider.toUpperCase()}_API_KEY kosong.` }, 500)
  }

  // Cegah path traversal / pengalihan ke host lain.
  const path = String(payload.path ?? '').replace(/^\/+/, '')
  if (path.includes('..') || path.includes('://')) {
    return json({ error: 'Path tidak valid' }, 400)
  }

  const method = payload.method === 'POST' ? 'POST' : 'GET'
  let url = `${BASES[provider]}/${path}`
  const headers: Record<string, string> = {}
  if (method === 'POST') headers['Content-Type'] = 'application/json'
  if (provider === 'groq') {
    headers['Authorization'] = `Bearer ${key}`
  } else {
    url += `${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`
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
