// src/components/SettingsModal.tsx
// Panel pengaturan: pilih provider (Groq/Gemini), masukkan API key, pilih model.
import { useEffect, useRef, useState } from 'react'
import type { Provider } from '../ai/types'
import { PROVIDERS } from '../ai/types'
import { USE_PROXY } from '../ai/providers'
import { useI18n } from '../i18n/i18n'
import { ModelPicker } from './ModelPicker'
import { ProviderIcon } from './ProviderIcon'

interface Props {
  provider: Provider
  apiKeys: Record<Provider, string>
  models: Record<Provider, string>
  onProvider: (p: Provider) => void
  onApiKey: (p: Provider, key: string) => void
  onModel: (p: Provider, m: string) => void
  onClose: () => void
}

export function SettingsModal({
  provider,
  apiKeys,
  models,
  onProvider,
  onApiKey,
  onModel,
  onClose,
}: Props) {
  const { t } = useI18n()
  const [show, setShow] = useState(false)
  const meta = PROVIDERS[provider]
  const closeRef = useRef<HTMLButtonElement>(null)

  // Tutup dengan Escape; fokuskan tombol tutup saat modal terbuka.
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <h2 className="modal__title">{t('settings.title')}</h2>
          <button ref={closeRef} className="pdr-nav-btn" onClick={onClose}>
            {t('settings.close')}
          </button>
        </div>

        <div className="field">
          <label className="field__label">{t('settings.provider')}</label>
          <div className="seg">
            {(Object.keys(PROVIDERS) as Provider[]).map((p) => (
              <button
                key={p}
                className={`seg__item${provider === p ? ' seg__item--active' : ''}`}
                onClick={() => onProvider(p)}
              >
                <ProviderIcon provider={p} size={13} />
                {PROVIDERS[p].name}
              </button>
            ))}
          </div>
        </div>

        {USE_PROXY ? (
          <div className="field">
            <label className="field__label">{t('settings.apiKey', { name: meta.name })}</label>
            <p className="field__hint">{t('settings.proxyHint')}</p>
          </div>
        ) : (
          <div className="field">
            <div className="field__label-row">
              <label className="field__label">{t('settings.apiKey', { name: meta.name })}</label>
              <a className="pdr-link" href={meta.keyUrl} target="_blank" rel="noreferrer">
                {t('settings.getKey')}
              </a>
            </div>
            <div className="key-row">
              <input
                className="pdr-input"
                type={show ? 'text' : 'password'}
                value={apiKeys[provider]}
                onChange={(e) => onApiKey(provider, e.target.value)}
                placeholder={t('settings.keyPlaceholder', { name: meta.name })}
                autoComplete="off"
                spellCheck={false}
              />
              <button className="pdr-nav-btn" onClick={() => setShow((v) => !v)}>
                {show ? t('settings.hide') : t('settings.show')}
              </button>
            </div>
            <p className="field__hint">{t('settings.keyHint', { name: meta.name })}</p>
          </div>
        )}

        <ModelPicker
          provider={provider}
          apiKey={apiKeys[provider]}
          value={models[provider]}
          onChange={(m) => onModel(provider, m)}
        />

        <button className="pdr-btn pdr-btn--primary modal__done" onClick={onClose}>
          {t('settings.done')}
        </button>
      </div>
    </div>
  )
}
