// src/components/SettingsModal.tsx
// Panel pengaturan: pilih provider (Groq/Gemini), masukkan API key, pilih model.
import { useState } from 'react'
import type { Provider } from '../ai/types'
import { PROVIDERS } from '../ai/types'
import { ModelPicker } from './ModelPicker'

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
  const [show, setShow] = useState(false)
  const meta = PROVIDERS[provider]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2 className="modal__title">Pengaturan</h2>
          <button className="pdr-nav-btn" onClick={onClose}>Tutup</button>
        </div>

        <div className="field">
          <label className="field__label">Penyedia AI</label>
          <div className="seg">
            {(Object.keys(PROVIDERS) as Provider[]).map((p) => (
              <button
                key={p}
                className={`seg__item${provider === p ? ' seg__item--active' : ''}`}
                onClick={() => onProvider(p)}
              >
                {PROVIDERS[p].name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field__label-row">
            <label className="field__label">API Key — {meta.name}</label>
            <a className="pdr-link" href={meta.keyUrl} target="_blank" rel="noreferrer">
              Dapatkan key
            </a>
          </div>
          <div className="key-row">
            <input
              className="pdr-input"
              type={show ? 'text' : 'password'}
              value={apiKeys[provider]}
              onChange={(e) => onApiKey(provider, e.target.value)}
              placeholder={`Tempel API key ${meta.name}…`}
              autoComplete="off"
              spellCheck={false}
            />
            <button className="pdr-nav-btn" onClick={() => setShow((v) => !v)}>
              {show ? 'Sembunyi' : 'Lihat'}
            </button>
          </div>
          <p className="field__hint">
            Key disimpan hanya di browser ini (localStorage) dan dikirim langsung
            ke {meta.name}.
          </p>
        </div>

        <ModelPicker
          provider={provider}
          apiKey={apiKeys[provider]}
          value={models[provider]}
          onChange={(m) => onModel(provider, m)}
        />

        <button className="pdr-btn pdr-btn--primary modal__done" onClick={onClose}>
          Selesai
        </button>
      </div>
    </div>
  )
}
