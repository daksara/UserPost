// src/web3/SendTransaction.tsx
//
// Widget interaktif Lesson 2 — mengirim transaksi pertama.
//
// Beda dengan Lesson 1 (read = gratis), WRITE/transaksi:
//   • butuh GAS (bayar pakai ETH testnet — ambil gratis dari faucet)
//   • butuh TANDA TANGAN di wallet (konfirmasi)
//   • butuh waktu sampai masuk blok (pending → confirmed)
//
// Transaksi paling aman untuk latihan: kirim 0 ETH ke diri sendiri. Tetap
// transaksi nyata (kena gas + masuk blok), tapi tidak memindahkan dana.
import { useAccount, useChainId, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { useState } from 'react'

const FAUCET_URL = 'https://www.alchemy.com/faucets/base-sepolia'
const EXPLORER = 'https://sepolia.basescan.org'

export function SendTransaction() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const onBase = chainId === baseSepolia.id
  const [copied, setCopied] = useState(false)

  const { data: hash, sendTransaction, isPending, error } = useSendTransaction()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (!isConnected) return <Note>Sambungkan wallet di <strong>Lesson 0</strong> dulu.</Note>
  if (!onBase) return <Note>Wallet-mu belum di Base Sepolia. Pindah jaringan dulu (tombolnya ada di <strong>Lesson 0</strong>).</Note>

  const copyAddr = async () => {
    if (!address) return
    try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }

  return (
    <div style={box}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        1. Butuh sedikit ETH testnet untuk gas. Ambil gratis di{' '}
        <a href={FAUCET_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          faucet Base Sepolia
        </a>{' '}(tempel address-mu di sana):
      </div>
      <button onClick={copyAddr} className="pdr-btn pdr-btn--ghost" style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
        {copied ? 'Tersalin!' : `${address?.slice(0, 10)}…${address?.slice(-8)}`}
      </button>

      <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        2. Kirim transaksi uji (0 ETH ke diri sendiri):
      </div>
      <button
        onClick={() => address && sendTransaction({ to: address, value: 0n })}
        disabled={isPending || confirming}
        className="pdr-btn pdr-btn--primary"
        style={{ alignSelf: 'flex-start' }}
      >
        {isPending ? 'Konfirmasi di wallet…' : confirming ? 'Menunggu blok…' : 'Kirim transaksi'}
      </button>

      {error && (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--red)' }}>
          {error.message.includes('insufficient funds')
            ? 'Saldo gas kurang. Ambil ETH testnet di faucet dulu (langkah 1).'
            : error.message.split('\n')[0]}
        </p>
      )}

      {hash && (
        <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer" className="pdr-link pdr-link--arrow" style={{ wordBreak: 'break-all' }}>
          Lihat transaksi di explorer →
        </a>
      )}

      {isSuccess && (
        <p className="pdr-rise" style={{
          margin: 0, padding: '12px 15px', borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: '0.9rem',
          fontWeight: 600, lineHeight: 1.5,
          border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        }}>
          Transaksi terkonfirmasi di blockchain. Kamu baru saja mengirim transaksi
          on-chain pertamamu — skill yang dipakai di setiap aksi web3 (swap, mint, dll).
        </p>
      )}
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...box, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{children}</div>
  )
}

const box: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 10,
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: 16,
}
