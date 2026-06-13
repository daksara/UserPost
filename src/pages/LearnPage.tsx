// src/pages/LearnPage.tsx
//
// Shell situs "Belajar Web3". Tiap lesson mengajarkan satu skill on-chain
// dengan cara MELAKUKANNYA langsung di browser — bukan sekadar membaca teori.
// Lesson 0 sudah hidup; sisanya placeholder yang akan kita isi satu per satu.
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectWallet } from '../web3/ConnectWallet'

interface Lesson {
  id: number
  title: string
  blurb: string
  ready: boolean
}

const LESSONS: Lesson[] = [
  { id: 0, title: 'Connect Wallet', blurb: 'Sambungkan MetaMask & baca address + saldo dari blockchain.', ready: true },
  { id: 1, title: 'Baca Data On-Chain', blurb: 'Panggil fungsi read sebuah smart contract dengan viem.', ready: false },
  { id: 2, title: 'Kirim Transaksi', blurb: 'Tanda tangani & kirim transaksi pertamamu di testnet.', ready: false },
  { id: 3, title: 'Token-Gated Content', blurb: 'Buka konten hanya untuk pemegang token tertentu.', ready: false },
  { id: 4, title: 'Mint Sertifikat NFT', blurb: 'Cetak NFT sebagai bukti kamu menyelesaikan kursus.', ready: false },
]

export default function LearnPage() {
  const [activeId, setActiveId] = useState(0)
  const active = LESSONS.find((l) => l.id === activeId)!

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <header style={{
        borderBottom: '1px solid var(--border)', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--accent)' }} />
        <strong style={{ fontSize: '1.05rem' }}>Belajar Web3</strong>
      </header>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: 20, display: 'grid', gap: 20, gridTemplateColumns: '1fr' }}>
        {/* Daftar lesson */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LESSONS.map((l) => (
            <button
              key={l.id}
              onClick={() => l.ready && setActiveId(l.id)}
              disabled={!l.ready}
              style={{
                textAlign: 'left', cursor: l.ready ? 'pointer' : 'default',
                background: l.id === activeId ? 'var(--accent-soft)' : 'var(--bg-card)',
                border: `1px solid ${l.id === activeId ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 12, padding: '12px 14px', opacity: l.ready ? 1 : 0.55,
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              }}
            >
              <span style={{
                flexShrink: 0, width: 26, height: 26, borderRadius: 13,
                background: l.id === activeId ? 'var(--accent)' : 'var(--bg-input)',
                color: l.id === activeId ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700,
              }}>
                {l.id}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  {l.title} {!l.ready && <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>· segera</span>}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l.blurb}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* Konten lesson aktif */}
        <main style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20,
        }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.3rem' }}>
            Lesson {active.id}: {active.title}
          </h1>
          <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            {active.blurb}
          </p>
          {active.id === 0 ? <Lesson0 /> : (
            <p style={{ color: 'var(--text-muted)' }}>Lesson ini segera hadir.</p>
          )}
        </main>
      </div>
    </div>
  )
}

function Lesson0() {
  const { isConnected } = useAccount()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
        Sebuah <strong>wallet</strong> adalah identitasmu di web3 — pengganti
        email &amp; password. Menyambungkan wallet artinya memberi izin app ini
        untuk <em>membaca</em> address publikmu (dan nanti meminta tanda tangan
        transaksi). App tidak pernah melihat private key-mu.
      </p>
      <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
        Klik tombol di bawah. MetaMask akan muncul minta persetujuan. Setelah
        tersambung, kamu akan lihat address &amp; saldomu di jaringan{' '}
        <strong>Base Sepolia</strong> (testnet) — dibaca langsung dari blockchain.
      </p>
      <ConnectWallet />
      {isConnected && (
        <p style={{
          margin: 0, padding: '10px 14px', borderRadius: 10,
          background: 'var(--accent-soft)', color: 'var(--accent-dark)',
          fontSize: '0.9rem', fontWeight: 600,
        }}>
          🎉 Selesai! Kamu baru saja menguasai skill web3 paling fundamental.
          Saldomu 0? Wajar — itu testnet kosong. Lesson berikutnya kita ambil
          token gratis dari faucet lalu kirim transaksi pertamamu.
        </p>
      )}
    </div>
  )
}
