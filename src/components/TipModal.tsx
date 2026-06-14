// src/components/TipModal.tsx
// Kotak "Beri tip" — dukungan sukarela lewat DANA.
import { useState } from 'react'

const DANA_NUMBER = '089605623197'

export function TipModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DANA_NUMBER)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2 className="modal__title">Beri tip</h2>
          <button className="pdr-nav-btn" onClick={onClose}>Tutup</button>
        </div>

        <p className="field__hint">
          Pendar gratis dipakai. Kalau alat ini membantu pekerjaanmu, kamu boleh
          memberi tip seikhlasnya lewat DANA. Terima kasih banyak.
        </p>

        <div className="tip-card">
          <span className="tip-card__label">DANA</span>
          <span className="tip-card__num">{DANA_NUMBER}</span>
          <button className="pdr-btn pdr-btn--primary tip-card__copy" onClick={copy}>
            {copied ? 'Nomor tersalin' : 'Salin nomor'}
          </button>
        </div>

        <p className="field__hint">
          Buka aplikasi DANA, pilih Kirim, lalu masukkan nomor di atas.
        </p>
      </div>
    </div>
  )
}
