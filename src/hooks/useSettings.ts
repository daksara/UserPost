// src/hooks/useSettings.ts
// Pengaturan AI yang tersimpan di localStorage: provider aktif, API key per
// provider, dan model terpilih per provider. Key default bisa diisi lewat
// env (VITE_GROQ_API_KEY / VITE_GEMINI_API_KEY) saat build.
import { useCallback, useEffect, useState } from 'react'
import type { Provider } from '../ai/types'
import { DEPRECATED_MODELS, PROVIDERS } from '../ai/types'
import type { Language } from '../ai/templates'
import { USE_PROXY } from '../ai/providers'

const STORAGE_KEY = 'pendar-settings'

export interface Settings {
  provider: Provider
  apiKeys: Record<Provider, string>
  models: Record<Provider, string>
  /** Bahasa jawaban AI yang dipaksa agar tidak tercampur. */
  language: Language
}

function defaults(): Settings {
  const env = import.meta.env
  return {
    provider: 'groq',
    apiKeys: {
      groq: env.VITE_GROQ_API_KEY ?? '',
      gemini: env.VITE_GEMINI_API_KEY ?? '',
    },
    models: {
      groq: PROVIDERS.groq.fallbackModels[0].id,
      gemini: PROVIDERS.gemini.fallbackModels[0].id,
    },
    language: 'id',
  }
}

/** Ganti model tersimpan yang sudah dihentikan provider dengan default valid. */
function migrateModels(models: Record<Provider, string>): Record<Provider, string> {
  const out = { ...models }
  for (const p of Object.keys(PROVIDERS) as Provider[]) {
    if (DEPRECATED_MODELS[p].includes(out[p])) {
      out[p] = PROVIDERS[p].fallbackModels[0].id
    }
  }
  return out
}

function load(): Settings {
  const base = defaults()
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      provider: saved.provider === 'gemini' ? 'gemini' : base.provider,
      apiKeys: { ...base.apiKeys, ...(saved.apiKeys || {}) },
      models: migrateModels({ ...base.models, ...(saved.models || {}) }),
      language: saved.language === 'en' ? 'en' : base.language,
    }
  } catch {
    return base
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const setProvider = useCallback(
    (provider: Provider) => setSettings((s) => ({ ...s, provider })),
    [],
  )

  const setApiKey = useCallback(
    (provider: Provider, key: string) =>
      setSettings((s) => ({ ...s, apiKeys: { ...s.apiKeys, [provider]: key } })),
    [],
  )

  const setModel = useCallback(
    (provider: Provider, model: string) =>
      setSettings((s) => ({ ...s, models: { ...s.models, [provider]: model } })),
    [],
  )

  const setLanguage = useCallback(
    (language: Language) => setSettings((s) => ({ ...s, language })),
    [],
  )

  const provider = settings.provider
  const apiKey = settings.apiKeys[provider]
  const model = settings.models[provider]
  const language = settings.language
  // Dalam mode proxy, server yang memegang key — front-end selalu "siap".
  const ready = USE_PROXY || apiKey.trim().length > 0

  return {
    settings,
    provider,
    apiKey,
    model,
    language,
    ready,
    useProxy: USE_PROXY,
    setProvider,
    setApiKey,
    setModel,
    setLanguage,
  }
}
