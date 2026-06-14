// src/components/Composer.tsx
// Kolom tulis pesan: textarea yang tumbuh otomatis mengikuti isi, plus aksi
// Kirim / Stop / Regenerasi. Enter mengirim, Shift+Enter baris baru.
import { useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onStop: () => void
  onRegenerate: () => void
  streaming: boolean
  canRegenerate: boolean
  placeholder: string
}

const MAX_HEIGHT = 240

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  onRegenerate,
  streaming,
  canRegenerate,
  placeholder,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Tumbuhkan textarea mengikuti tinggi konten (sampai batas), lalu scroll.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }, [value])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="composer">
      <textarea
        ref={ref}
        className="composer__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={placeholder}
      />
      <div className="composer__actions">
        <span className="composer__hint">Enter kirim · Shift+Enter baris baru</span>
        <div className="composer__buttons">
          {!streaming && canRegenerate && (
            <button className="pdr-btn pdr-btn--ghost" onClick={onRegenerate}>
              Regenerasi
            </button>
          )}
          {streaming ? (
            <button className="pdr-btn pdr-btn--ghost" onClick={onStop}>
              Stop
            </button>
          ) : (
            <button
              className="pdr-btn pdr-btn--primary"
              onClick={onSubmit}
              disabled={!value.trim()}
            >
              Kirim
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
