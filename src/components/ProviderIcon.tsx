// src/components/ProviderIcon.tsx
// Ikon SVG inline untuk tiap provider AI.
import type { Provider } from '../ai/types'

interface Props {
  provider: Provider
  size?: number
}

export function ProviderIcon({ provider, size = 14 }: Props) {
  return provider === 'groq' ? <GroqIcon size={size} /> : <GeminiIcon size={size} />
}

function GroqIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {/* Petir — simbol kecepatan Groq */}
      <path d="M13 2 4 14h7l-1 8 10-12h-7z" />
    </svg>
  )
}

function GeminiIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {/* Bintang empat ujung — logo Gemini */}
      <path d="M12 2c0 5.523-4.477 10-10 10 5.523 0 10 4.477 10 10 0-5.523 4.477-10 10-10-5.523 0-10-4.477-10-10z" />
    </svg>
  )
}
