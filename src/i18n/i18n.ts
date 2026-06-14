// src/i18n/i18n.ts
// Konteks bahasa antarmuka. App menyediakan { lang, t }; komponen membacanya
// lewat useI18n(). Dipisah dari komponen agar react-refresh tetap senang.
import { createContext, useContext } from 'react'
import type { Language } from '../ai/templates'
import { createT } from './translations'
import type { TFunc } from './translations'

export interface I18n {
  lang: Language
  t: TFunc
}

export const I18nContext = createContext<I18n>({ lang: 'id', t: createT('id') })

export function useI18n(): I18n {
  return useContext(I18nContext)
}

/**
 * Baca bahasa tersimpan langsung dari localStorage. Untuk dipakai di luar
 * pohon React/Provider (mis. ErrorBoundary) yang tak bisa memakai useI18n.
 */
export function getStoredLanguage(): Language {
  try {
    const saved = JSON.parse(localStorage.getItem('pendar-settings') || '{}')
    return saved.language === 'en' ? 'en' : 'id'
  } catch {
    return 'id'
  }
}
