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

const icBase = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const IconUnlocked = () => <svg {...icBase}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
const IconLocked = () => <svg {...icBase}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>

export function TokenGate() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const onBase = chainId === baseSepolia.id
  const { data: balance, isLoading } = useBalance({ address, chainId: baseSepolia.id })

  if (!isConnected) return <Note>Sambungkan wallet di <strong>Lesson 0</strong> dulu.</Note>
  if (!onBase) return <Note>Pindah ke Base Sepolia dulu (lihat <strong>Lesson 0</strong>).</Note>

  const unlocked = !!balance && balance.value > 0n

  return (
    <div style={box}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Syarat akses: memegang ETH di Base Sepolia.{' '}
        {isLoading ? 'Memeriksa…' : (
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
          <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconUnlocked /> Akses terbuka</div>
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
            Konten ini hanya terlihat karena wallet-mu memenuhi syarat on-chain.
            Inilah mesin di balik komunitas token-gated: server tak perlu "akun
            premium" — cukup cek kepemilikan di blockchain. Ganti pengecekan ini
            dengan saldo token ERC-20 atau kepemilikan NFT, dan kamu punya paywall web3.
          </p>
        </div>
      ) : (
        <div style={{
          padding: 16, borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card)', border: '1px dashed var(--border)',
          textAlign: 'center', color: 'var(--text-muted)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconLocked /> Terkunci</div>
          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
            Saldomu masih 0. Ambil ETH testnet gratis dari faucet (lihat{' '}
            <strong>Lesson 2</strong>), lalu buka lagi lesson ini — konten akan terbuka otomatis.
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
