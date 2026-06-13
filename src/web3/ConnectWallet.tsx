// src/web3/ConnectWallet.tsx
//
// Widget interaktif untuk Lesson 0. Inilah inti "Connect Wallet" — skill
// web3 paling fundamental. Perhatikan empat hook wagmi yang dipakai:
//
//   useConnect     — memicu pop-up wallet untuk menyambung.
//   useAccount     — status koneksi + address user yang tersambung.
//   useDisconnect  — memutus koneksi.
//   useBalance     — membaca saldo address langsung dari blockchain.
//
// Tidak ada "magic". Semua data datang dari wallet & RPC lewat hook ini.
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { formatUnits } from 'viem'

// Memendekkan address panjang (0x1234…abcd) — konvensi UI di semua dApp.
function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  // Chain yang sedang aktif di wallet. Kalau bukan Base Sepolia, data
  // on-chain (saldo/network) tidak relevan untuk lesson ini.
  const chainId = useChainId()
  const { switchChain, isPending: switching } = useSwitchChain()
  const onBaseSepolia = chainId === baseSepolia.id
  // Saldo otomatis di-refetch oleh wagmi saat address berubah.
  const { data: balance } = useBalance({ address })

  // Connector pertama = injected() yang kita daftarkan di config (MetaMask, dll).
  const injectedConnector = connectors[0]
  const hasWallet = typeof window !== 'undefined' && 'ethereum' in window
  // Di browser HP biasa, provider wallet tidak disuntik — wallet adalah app
  // terpisah. Solusinya: buka situs di browser dalam app MetaMask (deep link).
  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent)
  const mmDeepLink = typeof window !== 'undefined'
    ? `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
    : '#'

  if (!isConnected) {
    return (
      <div style={box}>
        {!hasWallet ? (
          isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Di browser HP, wallet tidak bisa terdeteksi langsung — MetaMask adalah
                app terpisah. Buka situs ini lewat <strong>browser di dalam app MetaMask</strong>,
                atau tap tombol di bawah.
              </p>
              <a href={mmDeepLink} className="pdr-btn pdr-btn--primary"
                 style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
                Buka di MetaMask
              </a>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Belum punya?{' '}
                <a href="https://metamask.io/download/" target="_blank" rel="noreferrer"
                   style={{ color: 'var(--accent)', fontWeight: 600 }}>Install MetaMask</a> dulu.
              </p>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Belum ada wallet terdeteksi. Pasang{' '}
              <a href="https://metamask.io/download/" target="_blank" rel="noreferrer"
                 style={{ color: 'var(--accent)', fontWeight: 600 }}>
                extension MetaMask
              </a>{' '}di browser ini, lalu refresh halaman.
            </p>
          )
        ) : (
          <>
            <button
              onClick={() => connect({ connector: injectedConnector })}
              disabled={isPending}
              className="pdr-btn pdr-btn--primary"
              style={{ alignSelf: 'flex-start' }}
            >
              {isPending ? 'Menyambung…' : 'Connect Wallet'}
            </button>
            {error && (
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--red)' }}>
                {error.message}
              </p>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div style={box}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#22c55e' }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: '#22c55e' }} />
          Tersambung
        </span>
        <button onClick={() => disconnect()} className="pdr-btn pdr-btn--ghost" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
          Disconnect
        </button>
      </div>
      <Row label="Address" value={address ? shortAddress(address) : '—'} mono />
      <Row label="Network" value={chain?.name ?? (onBaseSepolia ? 'Base Sepolia' : `Chain ${chainId}`)} />
      <Row
        label="Saldo"
        value={
          // On-chain, saldo selalu integer "wei" (bigint). formatUnits membaginya
          // dengan 10^decimals untuk jadi angka yang manusiawi (mis. 1.5 ETH).
          balance
            ? `${Number(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}`
            : '…'
        }
        mono
      />

      {!onBaseSepolia && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4,
          padding: 12, borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-soft)',
          border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, lineHeight: 1.4 }}>
            Wallet-mu belum di jaringan <strong>Base Sepolia</strong>. Pindah dulu
            agar saldo &amp; lesson berjalan benar.
          </span>
          <button
            onClick={() => switchChain({ chainId: baseSepolia.id })}
            disabled={switching}
            className="pdr-btn pdr-btn--primary"
            style={{ alignSelf: 'flex-start' }}
          >
            {switching ? 'Memindahkan…' : 'Pindah ke Base Sepolia'}
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{
        color: 'var(--text-primary)',
        fontWeight: 600,
        fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
      }}>
        {value}
      </span>
    </div>
  )
}

const box: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 12,
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 12, padding: 16,
}

