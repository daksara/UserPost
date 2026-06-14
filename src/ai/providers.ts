// src/ai/providers.ts
// Klien AI untuk Groq (OpenAI-compatible) dan Gemini. Semua panggilan
// dilakukan langsung dari browser memakai API key milik user (disimpan di
// localStorage). Fungsi murni di-export terpisah agar mudah diuji.

import type { ChatMessage, ModelInfo, Provider } from './types'

const GROQ_BASE = 'https://api.groq.com/openai/v1'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

// Model non-chat yang tidak relevan untuk asisten teks.
const GROQ_EXCLUDE = /whisper|tts|guard|embed|moderation/i
const GEMINI_EXCLUDE = /embedding|aqa|imagen|vision-only/i

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
  if (provider === 'groq') {
    const res = await fetch(`${GROQ_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) throw await toError('Groq', res)
    const json = await res.json()
    return filterGroqModels(json.data ?? [])
  }

  const res = await fetch(`${GEMINI_BASE}/models?key=${encodeURIComponent(apiKey)}&pageSize=200`)
  if (!res.ok) throw await toError('Gemini', res)
  const json = await res.json()
  return filterGeminiModels(json.models ?? [])
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

  const res =
    provider === 'groq'
      ? await fetch(`${GROQ_BASE}/chat/completions`, {
          method: 'POST',
          signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages, temperature, stream: true }),
        })
      : await fetch(
          `${GEMINI_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...toGeminiPayload(messages),
              generationConfig: { temperature },
            }),
          },
        )

  if (!res.ok) throw await toError(provider === 'groq' ? 'Groq' : 'Gemini', res)
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
    detail = body?.error?.message || body?.error?.[0]?.message || JSON.stringify(body?.error || body)
  } catch {
    detail = await res.text().catch(() => '')
  }
  return new Error(`${label} error ${res.status}: ${detail || res.statusText}`)
}
