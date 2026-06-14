// src/components/Composer.tsx
// Kolom tulis pesan ala Claude: satu kotak membulat berisi textarea auto-grow
// dengan baris aksi di dalamnya — tombol "+" (menu template) di kiri, tombol
// kirim/stop berbentuk ikon di kanan. Enter mengirim, Shift+Enter baris baru.
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
      <div className="composer__box">
        <textarea
          ref={ref}
          className="composer__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
        />
        <div className="composer__bar">
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
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      className="tmpl-menu__item"
                      role="menuitem"
                      onClick={() => pick(tpl.id)}
                    >
                      <span className="tmpl-menu__title">{tpl.title}</span>
                      <span className="tmpl-menu__desc">{tpl.desc}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="composer__right">
            <span className="composer__hint">{t('composer.hint')}</span>
            {streaming ? (
              <button
                className="composer__icon-btn composer__stop"
                onClick={onStop}
                aria-label={t('composer.stop')}
                title={t('composer.stop')}
              >
                <StopIcon />
              </button>
            ) : (
              <button
                className="composer__icon-btn composer__send"
                onClick={onSubmit}
                disabled={!value.trim()}
                aria-label={t('composer.send')}
                title={t('composer.send')}
              >
                <SendIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M12 5l-6 6M12 5l6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
    </svg>
  )
}
