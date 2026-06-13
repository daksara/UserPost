// src/hooks/useTheme.ts
// Manajemen tema tampilan: Light → Dark → OLED.
// Pilihan disimpan di localStorage dan diterapkan via atribut data-theme di <html>.
import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export const THEMES: Theme[] = ['light', 'dark']
const STORAGE_KEY = 'userpost-theme'

// Warna address bar mobile per tema (sinkron dengan --bg di index.css)
const THEME_COLORS: Record<Theme, string> = {
  light: '#f7f6f3',
  dark: '#0e0e11',
}

export function getStoredTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
  // Default dark — tampilan premium "amber glow" Pendar paling kuat di gelap
  return saved && THEMES.includes(saved) ? saved : 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLORS[theme])
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)
  // Putar berurutan: light → dark → oled → light
  const cycleTheme = () =>
    setThemeState(prev => THEMES[(THEMES.indexOf(prev) + 1) % THEMES.length])

  return { theme, setTheme, cycleTheme }
}
