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
      fill="none"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {/* Bentuk arc terbuka khas logo Groq */}
      <path
        d="M20 12a8 8 0 1 0-5.657 7.657"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
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
