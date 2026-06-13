// src/web3/TokenGate.tsx
//
// Widget interaktif Lesson 3 — token-gated content.
//
// Pola inti: BACA kepemilikan on-chain user → tampilkan/ sembunyikan konten
// berdasarkan hasilnya. Ini fondasi semua "akses berbasis token/NFT"
// (komunitas berbayar, fitur premium, dll).
//
// Di sini gerbangnya: "punya ETH di Base Sepolia". Kalau saldo > 0 (mis. sudah
// ambil dari faucet di Lesson 2), konten rahasia terbuka. Polanya identik untuk
// gating berbasis token ERC-20 atau NFT — tinggal ganti yang dibaca.
import { useAccount, useBalance, useChainId } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { formatUnits } from 'viem'
import { useT } from '../i18n'

const icBase = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const IconUnlocked = () => <svg {...icBase}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
const IconLocked = () => <svg {...icBase}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>

export function TokenGate() {
  const t = useT()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const onBase = chainId === baseSepolia.id
  const { data: balance, isLoading } = useBalance({ address, chainId: baseSepolia.id })

  if (!isConnected) return <Note>{t('Sambungkan wallet di Lesson 0 dulu.', 'Connect your wallet in Lesson 0 first.')}</Note>
  if (!onBase) return <Note>{t('Pindah ke Base Sepolia dulu (lihat Lesson 0).', 'Switch to Base Sepolia first (see Lesson 0).')}</Note>

  const unlocked = !!balance && balance.value > 0n

  return (
    <div style={box}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {t('Syarat akses: memegang ETH di Base Sepolia. ', 'Access requirement: hold ETH on Base Sepolia. ')}
        {isLoading ? t('Memeriksa…', 'Checking…') : (
          <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {balance ? `${Number(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}` : '0'}
          </strong>
        )}
      </div>

      {unlocked ? (
        <div className="pdr-rise" style={{
          padding: 16, borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-soft)', border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
        }}>
          <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconUnlocked /> {t('Akses terbuka', 'Access unlocked')}</div>
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
            {t(
              'Konten ini hanya terlihat karena wallet-mu memenuhi syarat on-chain. Inilah mesin di balik komunitas token-gated: server tak perlu "akun premium" — cukup cek kepemilikan di blockchain. Ganti pengecekan ini dengan saldo token ERC-20 atau kepemilikan NFT, dan kamu punya paywall web3.',
              'You can see this content only because your wallet meets an on-chain condition. This is the engine behind token-gated communities: no "premium account" on a server — just check ownership on-chain. Swap this check for an ERC-20 balance or NFT ownership, and you have a web3 paywall.',
            )}
          </p>
        </div>
      ) : (
        <div style={{
          padding: 16, borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card)', border: '1px dashed var(--border)',
          textAlign: 'center', color: 'var(--text-muted)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconLocked /> {t('Terkunci', 'Locked')}</div>
          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
            {t(
              'Saldomu masih 0. Ambil ETH testnet gratis dari faucet (lihat Lesson 2), lalu buka lagi lesson ini — konten akan terbuka otomatis.',
              'Your balance is still 0. Get free testnet ETH from the faucet (see Lesson 2), then reopen this lesson — the content unlocks automatically.',
            )}
          </p>
        </div>
      )}
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <div style={{ ...box, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{children}</div>
}

const box: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 12,
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: 16,
}
