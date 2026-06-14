// src/ai/types.ts
// Tipe bersama untuk lapisan AI (provider Groq & Gemini).

export type Provider = 'groq' | 'gemini'

export type Role = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: Role
  content: string
}

// Model yang bisa dipilih user di dropdown.
export interface ModelInfo {
  id: string
  label: string
}

export interface ProviderMeta {
  id: Provider
  name: string
  /** URL halaman pembuatan API key, ditampilkan di Pengaturan. */
  keyUrl: string
  /** Model default bila daftar dinamis belum termuat. */
  fallbackModels: ModelInfo[]
}

export const PROVIDERS: Record<Provider, ProviderMeta> = {
  groq: {
    id: 'groq',
    name: 'Groq',
    keyUrl: 'https://console.groq.com/keys',
    fallbackModels: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (instant)' },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    fallbackModels: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    ],
  },
}

/**
 * Model lama yang sudah dihentikan provider (mengembalikan 404). Dipakai untuk
 * memigrasikan pilihan tersimpan pengguna lama ke model default yang valid.
 */
export const DEPRECATED_MODELS: Record<Provider, string[]> = {
  groq: [],
  gemini: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'],
}
