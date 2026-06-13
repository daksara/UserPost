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
import { useT } from '../i18n'

const FAUCET_URL = 'https://www.alchemy.com/faucets/base-sepolia'
const EXPLORER = 'https://sepolia.basescan.org'

export function SendTransaction() {
  const t = useT()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const onBase = chainId === baseSepolia.id
  const [copied, setCopied] = useState(false)

  const { data: hash, sendTransaction, isPending, error } = useSendTransaction()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (!isConnected) return <Note>{t('Sambungkan wallet di Lesson 0 dulu.', 'Connect your wallet in Lesson 0 first.')}</Note>
  if (!onBase) return <Note>{t('Wallet-mu belum di Base Sepolia. Pindah jaringan dulu (tombolnya ada di Lesson 0).', 'Your wallet is not on Base Sepolia. Switch network first (the button is in Lesson 0).')}</Note>

  const copyAddr = async () => {
    if (!address) return
    try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }

  return (
    <div style={box}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {t('1. Butuh sedikit ETH testnet untuk gas. Ambil gratis di ', '1. You need a little testnet ETH for gas. Get it free at the ')}
        <a href={FAUCET_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          {t('faucet Base Sepolia', 'Base Sepolia faucet')}
        </a>{t(' (tempel address-mu di sana):', ' (paste your address there):')}
      </div>
      <button onClick={copyAddr} className="pdr-btn pdr-btn--ghost" style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
        {copied ? t('Tersalin!', 'Copied!') : `${address?.slice(0, 10)}…${address?.slice(-8)}`}
      </button>

      <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {t('2. Kirim transaksi uji (0 ETH ke diri sendiri):', '2. Send a test transaction (0 ETH to yourself):')}
      </div>
      <button
        onClick={() => address && sendTransaction({ to: address, value: 0n })}
        disabled={isPending || confirming}
        className="pdr-btn pdr-btn--primary"
        style={{ alignSelf: 'flex-start' }}
      >
        {isPending ? t('Konfirmasi di wallet…', 'Confirm in wallet…') : confirming ? t('Menunggu blok…', 'Waiting for block…') : t('Kirim transaksi', 'Send transaction')}
      </button>

      {error && (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--red)' }}>
          {error.message.includes('insufficient funds')
            ? t('Saldo gas kurang. Ambil ETH testnet di faucet dulu (langkah 1).', 'Not enough gas. Get testnet ETH from the faucet first (step 1).')
            : error.message.split('\n')[0]}
        </p>
      )}

      {hash && (
        <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer" className="pdr-link pdr-link--arrow" style={{ wordBreak: 'break-all' }}>
          {t('Lihat transaksi di explorer →', 'View transaction on explorer →')}
        </a>
      )}

      {isSuccess && (
        <p className="pdr-rise" style={{
          margin: 0, padding: '12px 15px', borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: '0.9rem',
          fontWeight: 600, lineHeight: 1.5,
          border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        }}>
          {t(
            'Transaksi terkonfirmasi di blockchain. Kamu baru saja mengirim transaksi on-chain pertamamu — skill yang dipakai di setiap aksi web3 (swap, mint, dll).',
            'Transaction confirmed on-chain. You just sent your first on-chain transaction — the skill behind every web3 action (swap, mint, etc).',
          )}
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
