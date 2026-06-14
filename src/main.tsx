import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { applyTheme, getStoredTheme } from './hooks/useTheme'

// Terapkan tema tersimpan sebelum render pertama agar tidak flash tema salah.
applyTheme(getStoredTheme())

// Sembunyikan splash loading (di index.html) setelah app ter-render, dengan
// waktu tampil minimum agar animasi logo Pendar sempat terlihat (efek splash
// seperti Claude), lalu fade-out halus dan hapus dari DOM.
function hideSplash() {
  const el = document.getElementById('pendar-splash')
  if (!el) return
  el.classList.add('pendar-splash--hide')
  window.setTimeout(() => el.remove(), 450)
}

const splashStart = performance.now()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

requestAnimationFrame(() => {
  const elapsed = performance.now() - splashStart
  window.setTimeout(hideSplash, Math.max(0, 500 - elapsed))
})
