// src/hooks/useTheme.ts
// Manajemen tema tampilan: Terang ↔ Gelap. Pilihan disimpan di localStorage
// dan diterapkan via atribut data-theme di <html>.
import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export const THEMES: Theme[] = ['light', 'dark']
const STORAGE_KEY = 'pendar-theme'
const LEGACY_KEY = 'userpost-theme' // dari versi app sebelumnya

// Warna address bar mobile per tema (sinkron dengan --bg di index.css)
const THEME_COLORS: Record<Theme, string> = {
  light: '#faf9f5',
  dark: '#262624',
}

export function getStoredTheme(): Theme {
  const saved = (localStorage.getItem(STORAGE_KEY) ??
    localStorage.getItem(LEGACY_KEY)) as Theme | null
  // Default gelap — tampilan premium Pendar paling kuat di mode gelap.
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
  // Putar berurutan antar tema yang tersedia.
  const cycleTheme = () =>
    setThemeState((prev) => THEMES[(THEMES.indexOf(prev) + 1) % THEMES.length])

  return { theme, setTheme, cycleTheme }
}
