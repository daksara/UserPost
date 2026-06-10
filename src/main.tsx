import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { applyTheme, getStoredTheme } from './hooks/useTheme'

// Terapkan tema tersimpan sebelum render pertama agar splash/auth page
// tidak flash dengan tema yang salah
applyTheme(getStoredTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
