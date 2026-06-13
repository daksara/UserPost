// src/web3/ReadContract.tsx
//
// Widget interaktif Lesson 1 — membaca data langsung dari blockchain.
//
// Konsep inti: ada dua jenis interaksi dengan smart contract:
//   • READ  (view/pure) — GRATIS, tanpa gas, tanpa tanda tangan. Cukup tanya
//                         ke node lewat RPC. Bahkan tanpa wallet tersambung.
//   • WRITE (transaksi) — bayar gas + tanda tangan wallet. (Itu Lesson 2.)
//
// Di sini kita panggil fungsi-fungsi READ standar ERC-20 — name(), symbol(),
// decimals(), totalSupply() — pada kontrak WETH di Base Sepolia.
import { useReadContracts, useBlockNumber } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { formatUnits } from 'viem'

// WETH adalah "predeploy" standar di chain OP-stack (termasuk Base) — selalu
// ada di alamat ini. Cocok jadi contoh kontrak ERC-20 yang pasti tersedia.
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as const

// ABI = "daftar menu" fungsi sebuah kontrak. Kita hanya butuh 4 fungsi read.
// `as const` penting agar wagmi/viem bisa menyimpulkan tipe hasilnya dengan tepat.
const erc20Abi = [
  { type: 'function', name: 'name', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'totalSupply', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const

function short(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

export function ReadContract() {
  // Satu hook, banyak panggilan read sekaligus (lebih efisien dari 4 hook).
  const base = { address: WETH_ADDRESS, abi: erc20Abi, chainId: baseSepolia.id } as const
  const { data, isLoading, error, refetch, isRefetching } = useReadContracts({
    contracts: [
      { ...base, functionName: 'name' },
      { ...base, functionName: 'symbol' },
      { ...base, functionName: 'decimals' },
      { ...base, functionName: 'totalSupply' },
    ],
  })

  // Nomor blok terbaru — bukti data ini hidup & dibaca real-time dari chain.
  const { data: blockNumber } = useBlockNumber({ chainId: baseSepolia.id, watch: true })

  const name = data?.[0]?.result as string | undefined
  const symbol = data?.[1]?.result as string | undefined
  const decimals = data?.[2]?.result as number | undefined
  const totalSupply = data?.[3]?.result as bigint | undefined

  return (
    <div style={box}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Blok terbaru: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {blockNumber ? blockNumber.toString() : '…'}
          </strong>
        </span>
        <button onClick={() => refetch()} disabled={isRefetching} className="pdr-btn pdr-btn--ghost"
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
          {isRefetching ? 'Membaca…' : 'Baca ulang'}
        </button>
      </div>

      <Row label="Kontrak" value={short(WETH_ADDRESS)} mono />

      {error ? (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--red)' }}>
          Gagal membaca: {error.message}
        </p>
      ) : isLoading ? (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Membaca dari blockchain…</p>
      ) : (
        <>
          <Row label="name()" value={name ?? '—'} />
          <Row label="symbol()" value={symbol ?? '—'} mono />
          <Row label="decimals()" value={decimals != null ? String(decimals) : '—'} mono />
          <Row
            label="totalSupply()"
            value={
              totalSupply != null && decimals != null
                ? `${Number(formatUnits(totalSupply, decimals)).toLocaleString()} ${symbol ?? ''}`
                : '—'
            }
            mono
          />
        </>
      )}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: '0.9rem' }}>
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{label}</span>
      <span style={{
        color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      }}>
        {value}
      </span>
    </div>
  )
}

const box: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 12,
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: 16,
}
