// src/components/ModelPicker.tsx
// Dropdown model. Memuat daftar model relevan secara dinamis dari provider
// (butuh API key); jika gagal/kosong, pakai daftar fallback bawaan.
import { useCallback, useEffect, useState } from 'react'
import { listModels } from '../ai/providers'
import type { ModelInfo, Provider } from '../ai/types'
import { PROVIDERS } from '../ai/types'

interface Props {
  provider: Provider
  apiKey: string
  value: string
  onChange: (model: string) => void
}

export function ModelPicker({ provider, apiKey, value, onChange }: Props) {
  const fallback = PROVIDERS[provider].fallbackModels
  const [models, setModels] = useState<ModelInfo[]>(fallback)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!apiKey.trim()) {
      setModels(fallback)
      setErr('Masukkan API key untuk memuat daftar model terbaru.')
      return
    }
    setLoading(true)
    setErr(null)
    try {
      const list = await listModels(provider, apiKey)
      if (list.length) {
        setModels(list)
        // Pastikan model terpilih masih ada di daftar baru.
        if (!list.some((m) => m.id === value)) onChange(list[0].id)
      } else {
        setModels(fallback)
      }
    } catch (e) {
      setModels(fallback)
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, apiKey])

  // Muat ulang saat provider/key berubah.
  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="field">
      <div className="field__label-row">
        <label className="field__label">Model</label>
        <button type="button" className="pdr-link" onClick={refresh} disabled={loading}>
          {loading ? 'Memuat…' : 'Muat ulang'}
        </button>
      </div>
      <select
        className="pdr-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
        {/* Jaga agar model tersimpan tetap tampil meski tak ada di daftar */}
        {!models.some((m) => m.id === value) && <option value={value}>{value}</option>}
      </select>
      {err && <p className="field__hint field__hint--warn">{err}</p>}
      {!err && <p className="field__hint">{models.length} model relevan tersedia.</p>}
    </div>
  )
}
