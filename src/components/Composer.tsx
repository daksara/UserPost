// src/components/Composer.tsx
// Kolom tulis pesan: textarea yang tumbuh otomatis mengikuti isi, plus aksi
// Kirim / Stop / Regenerasi. Enter mengirim, Shift+Enter baris baru.
// Tombol "+" membuka menu template (mirip Claude).
import { useEffect, useRef, useState } from 'react'
import type { Template } from '../ai/templates'
import { useI18n } from '../i18n/i18n'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onStop: () => void
  streaming: boolean
  placeholder: string
  templates: Template[]
  onPickTemplate: (id: string) => void
}

const MAX_HEIGHT = 240

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  streaming,
  placeholder,
  templates,
  onPickTemplate,
}: Props) {
  const { t } = useI18n()
  const ref = useRef<HTMLTextAreaElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

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

  const pick = (id: string) => {
    onPickTemplate(id)
    setMenuOpen(false)
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
        <div className="composer__tools">
          <button
            className="composer__plus"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={t('composer.pickTemplate')}
            aria-expanded={menuOpen}
            title={t('composer.templates')}
          >
            +
          </button>
          {menuOpen && (
            <>
              <div className="tmpl-menu__scrim" onClick={() => setMenuOpen(false)} />
              <div className="tmpl-menu" role="menu">
                <div className="tmpl-menu__head">{t('composer.templates')}</div>
                {templates.map((t) => (
                  <button
                    key={t.id}
                    className="tmpl-menu__item"
                    role="menuitem"
                    onClick={() => pick(t.id)}
                  >
                    <span className="tmpl-menu__title">{t.title}</span>
                    <span className="tmpl-menu__desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          <span className="composer__hint">{t('composer.hint')}</span>
        </div>
        <div className="composer__buttons">
          {streaming ? (
            <button className="pdr-btn pdr-btn--ghost" onClick={onStop}>
              {t('composer.stop')}
            </button>
          ) : (
            <button
              className="pdr-btn pdr-btn--primary"
              onClick={onSubmit}
              disabled={!value.trim()}
            >
              {t('composer.send')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
