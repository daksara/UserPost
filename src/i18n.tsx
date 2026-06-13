// src/i18n.tsx
//
// i18n ringan tanpa dependensi. Bahasa disimpan di localStorage.
// Pemakaian:
//   const t = useT()
//   t('Halo', 'Hello')   // pilih string sesuai bahasa aktif
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type Lang = 'id' | 'en'
const KEY = 'pendar-lang'

interface LangState { lang: Lang; setLang: (l: Lang) => void; toggle: () => void }
const LangContext = createContext<LangState>({ lang: 'id', setLang: () => {}, toggle: () => {} })

function getStored(): Lang {
  try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'id' } catch { return 'id' }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStored)
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(KEY, l) } catch { /* ignore */ }
  }, [])
  const toggle = useCallback(() => setLang(lang === 'en' ? 'id' : 'en'), [lang, setLang])
  return <LangContext.Provider value={{ lang, setLang, toggle }}>{children}</LangContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLang = () => useContext(LangContext)

// Hook praktis: t('teks ID', 'text EN')
// eslint-disable-next-line react-refresh/only-export-components
export function useT() {
  const { lang } = useLang()
  return (id: string, en: string) => (lang === 'en' ? en : id)
}
