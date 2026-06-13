import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LearnApp from './LearnApp'
import { applyTheme, getStoredTheme } from './hooks/useTheme'

// Terapkan tema tersimpan sebelum render pertama agar halaman tidak flash
// dengan tema yang salah
applyTheme(getStoredTheme())

// Situs ini sekarang adalah platform "Belajar Web3". App sosial lama (App.tsx
// + pages feed/messages/profile) masih ada di repo bila ingin dirujuk kembali.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LearnApp />
  </StrictMode>
)
