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
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { formatUnits } from 'viem'

// Memendekkan address panjang (0x1234…abcd) — konvensi UI di semua dApp.
function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  // Saldo otomatis di-refetch oleh wagmi saat address berubah.
  const { data: balance } = useBalance({ address })

  // Connector pertama = injected() yang kita daftarkan di config (MetaMask, dll).
  const injectedConnector = connectors[0]
  const hasWallet = typeof window !== 'undefined' && 'ethereum' in window

  if (!isConnected) {
    return (
      <div style={box}>
        {!hasWallet ? (
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Belum ada wallet terdeteksi. Pasang{' '}
            <a href="https://metamask.io/download/" target="_blank" rel="noreferrer"
               style={{ color: 'var(--accent)', fontWeight: 600 }}>
              MetaMask
            </a>{' '}dulu, lalu refresh halaman ini.
          </p>
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
      <Row label="Network" value={chain?.name ?? 'Unknown'} />
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

