// src/ai/providers.ts
// Klien AI untuk Groq (OpenAI-compatible) dan Gemini.
//
// Dua mode transport:
//  - Langsung (default): browser memanggil provider memakai API key user yang
//    tersimpan di localStorage.
//  - Proxy (VITE_USE_PROXY=1): browser memanggil /api/proxy; server (lihat
//    api/proxy.ts) yang menyisipkan API key dari env, sehingga key tidak
//    pernah ada di browser. Cocok untuk deploy publik.
//
// Fungsi murni di-export terpisah agar mudah diuji.

import type { ChatMessage, ModelInfo, Provider } from './types'

const BASES: Record<Provider, string> = {
  groq: 'https://api.groq.com/openai/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
}

const env = import.meta.env
export const USE_PROXY = env.VITE_USE_PROXY === '1' || env.VITE_USE_PROXY === 'true'

// Model non-chat yang tidak relevan untuk asisten teks.
const GROQ_EXCLUDE = /whisper|tts|guard|embed|moderation/i
const GEMINI_EXCLUDE = /embedding|aqa|imagen|vision-only/i

export const MAX_STREAM_RETRIES = 2

/** Status sementara yang layak dicoba ulang (rate-limit / error server). Murni & dapat diuji. */
export function isRetriableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600)
}

/** Backoff sederhana (ms) untuk percobaan ke-`attempt` (1-based). Murni & dapat diuji. */
export function retryBackoffMs(attempt: number): number {
  return 300 * 2 ** (attempt - 1)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface ProviderReq {
  provider: Provider
  /** Path setelah base, mis. 'models' atau 'chat/completions'. */
  path: string
  method?: 'GET' | 'POST'
  body?: unknown
  apiKey: string
  signal?: AbortSignal
}

// Satu titik untuk menjangkau provider — lewat proxy server atau langsung.
// Dalam mode proxy, key milik user diabaikan; server yang menyisipkan key.
function providerFetch({ provider, path, method = 'GET', body, apiKey, signal }: ProviderReq) {
  if (USE_PROXY) {
    return fetch('/api/proxy', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, path, method, body }),
    })
  }

  const headers: Record<string, string> = {}
  if (method === 'POST') headers['Content-Type'] = 'application/json'
  let url = `${BASES[provider]}/${path}`
  if (provider === 'groq') {
    headers['Authorization'] = `Bearer ${apiKey}`
  } else {
    url += `${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`
  }
  return fetch(url, { method, signal, headers, body: method === 'POST' ? JSON.stringify(body) : undefined })
}

// ── Penyaring model (murni, dapat diuji) ──────────────────────────────

interface GroqRawModel { id: string; active?: boolean }

/** Ambil hanya model chat aktif dari respons /models Groq, urut alfabet. */
export function filterGroqModels(raw: GroqRawModel[]): ModelInfo[] {
  return raw
    .filter((m) => m.active !== false && !GROQ_EXCLUDE.test(m.id))
    .map((m) => ({ id: m.id, label: m.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

interface GeminiRawModel {
  name: string
  displayName?: string
  supportedGenerationMethods?: string[]
}

/** Ambil hanya model Gemini yang mendukung generateContent (chat). */
export function filterGeminiModels(raw: GeminiRawModel[]): ModelInfo[] {
  return raw
    .filter(
      (m) =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        !GEMINI_EXCLUDE.test(m.name),
    )
    .map((m) => {
      const id = m.name.replace(/^models\//, '')
      return { id, label: m.displayName || id }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}

interface GeminiPayload {
  systemInstruction?: { parts: { text: string }[] }
  contents: { role: 'user' | 'model'; parts: { text: string }[] }[]
}

/** Ubah riwayat chat gaya OpenAI menjadi payload Gemini. */
export function toGeminiPayload(messages: ChatMessage[]): GeminiPayload {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n')
    .trim()

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: m.content }],
    }))

  return {
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents,
  }
}

// ── Daftar model (jaringan) ───────────────────────────────────────────

export async function listModels(provider: Provider, apiKey: string): Promise<ModelInfo[]> {
  const path = provider === 'groq' ? 'models' : 'models?pageSize=200'
  const res = await providerFetch({ provider, path, apiKey })
  if (!res.ok) throw await toError(label(provider), res)
  const json = await res.json()
  return provider === 'groq'
    ? filterGroqModels(json.data ?? [])
    : filterGeminiModels(json.models ?? [])
}

function label(provider: Provider): string {
  return provider === 'groq' ? 'Groq' : 'Gemini'
}

// ── Chat streaming ────────────────────────────────────────────────────

export interface ChatRequest {
  provider: Provider
  apiKey: string
  model: string
  messages: ChatMessage[]
  temperature?: number
}

/**
 * Streaming jawaban AI. Memanggil `onToken` tiap potongan teks tiba.
 * Lempar Error jika request gagal atau dibatalkan lewat `signal`.
 */
export async function streamChat(
  req: ChatRequest,
  onToken: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const { provider, apiKey, model, messages, temperature = 0.7 } = req

  const { path, body } =
    provider === 'groq'
      ? {
          path: 'chat/completions',
          body: { model, messages, temperature, stream: true },
        }
      : {
          path: `models/${model}:streamGenerateContent?alt=sse`,
          body: { ...toGeminiPayload(messages), generationConfig: { temperature } },
        }

  // Coba ulang hanya kegagalan AWAL yang sementara (429/5xx atau error jaringan),
  // sebelum satu token pun mengalir — stream yang sudah jalan tidak bisa diulang.
  let res: Response | null = null
  for (let attempt = 1; attempt <= MAX_STREAM_RETRIES + 1; attempt++) {
    try {
      res = await providerFetch({ provider, path, method: 'POST', body, apiKey, signal })
    } catch (e) {
      if (signal?.aborted || attempt > MAX_STREAM_RETRIES) throw e
      await delay(retryBackoffMs(attempt))
      continue
    }
    if (res.ok || !isRetriableStatus(res.status) || attempt > MAX_STREAM_RETRIES || signal?.aborted) break
    await delay(retryBackoffMs(attempt))
  }
  if (!res) throw new Error('Permintaan gagal tanpa respons.')

  if (!res.ok) throw await toError(label(provider), res)
  if (!res.body) throw new Error('Streaming tidak didukung browser ini.')

  await readSSE(res.body, (data) => {
    const text = provider === 'groq' ? extractGroqDelta(data) : extractGeminiDelta(data)
    if (text) onToken(text)
  })
}

function extractGroqDelta(data: string): string {
  try {
    return JSON.parse(data)?.choices?.[0]?.delta?.content ?? ''
  } catch {
    return ''
  }
}

function extractGeminiDelta(data: string): string {
  try {
    const parts = JSON.parse(data)?.candidates?.[0]?.content?.parts ?? []
    return parts.map((p: { text?: string }) => p.text ?? '').join('')
  } catch {
    return ''
  }
}

// Baca aliran SSE (Server-Sent Events) baris demi baris, panggil cb tiap
// payload `data:` selain penanda akhir `[DONE]`.
async function readSSE(body: ReadableStream<Uint8Array>, cb: (data: string) => void) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let nl: number
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).trim()
      buffer = buffer.slice(nl + 1)
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (data === '[DONE]' || data === '') continue
      cb(data)
    }
  }
}

async function toError(label: string, res: Response): Promise<Error> {
  if (res.status === 401 || res.status === 403) {
    return new Error(`${label}: API key tidak valid atau tidak punya akses (${res.status}).`)
  }
  let detail: string
  try {
    const body = await res.json()
    const err = body?.error
    detail =
      (typeof err === 'string' ? err : err?.message || err?.[0]?.message) ||
      JSON.stringify(err || body)
  } catch {
    detail = await res.text().catch(() => '')
  }
  return new Error(`${label} error ${res.status}: ${detail || res.statusText}`)
}
