// src/web3/MintNFT.tsx
//
// Widget interaktif Lesson 4 — mint NFT sertifikat (write ke kontrak ERC-721).
//
// Menggabungkan semua skill sebelumnya: connect (L0), read balanceOf (L1),
// transaksi + tunggu konfirmasi (L2). Bedanya, write-nya memanggil fungsi
// SPESIFIK sebuah kontrak (mint) lewat useWriteContract — bukan transfer ETH.
//
// Kontrak sertifikat ini milikmu sendiri: deploy ERC-721 sederhana (lihat teks
// lesson), lalu set alamatnya di env VITE_CERT_NFT_ADDRESS. Tanpa itu, widget
// menampilkan panduan konfigurasi.
import { useEffect } from 'react'
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { useT } from '../i18n'

const CERT_ADDRESS = import.meta.env.VITE_CERT_NFT_ADDRESS as `0x${string}` | undefined
const EXPLORER = 'https://sepolia.basescan.org'

const certAbi = [
  { type: 'function', name: 'mint', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

export function MintNFT() {
  const t = useT()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const onBase = chainId === baseSepolia.id

  const { data: owned, refetch } = useReadContract({
    address: CERT_ADDRESS,
    abi: certAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!CERT_ADDRESS && !!address },
  })

  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Setelah mint terkonfirmasi, baca ulang balanceOf agar jumlah ter-update.
  useEffect(() => { if (isSuccess) refetch() }, [isSuccess, refetch])

  if (!CERT_ADDRESS) {
    return (
      <Note>
        {t('Kontrak sertifikat belum dikonfigurasi. Deploy ERC-721 sederhana (kode & langkahnya ada di teks lesson di atas), lalu set ', 'The certificate contract is not configured yet. Deploy the simple ERC-721 (code & steps are in the lesson text above), then set ')}
        <code>VITE_CERT_NFT_ADDRESS</code> {t('di file .env dan deploy ulang.', 'in your .env and redeploy.')}
      </Note>
    )
  }
  if (!isConnected) return <Note>{t('Sambungkan wallet di Lesson 0 dulu.', 'Connect your wallet in Lesson 0 first.')}</Note>
  if (!onBase) return <Note>{t('Pindah ke Base Sepolia dulu (lihat Lesson 0).', 'Switch to Base Sepolia first (see Lesson 0).')}</Note>

  const alreadyOwns = typeof owned === 'bigint' && owned > 0n

  return (
    <div style={box}>
      <Row label={t('Kontrak', 'Contract')} value={`${CERT_ADDRESS.slice(0, 8)}…${CERT_ADDRESS.slice(-6)}`} />
      <Row label={t('Sertifikat dimiliki', 'Certificates owned')} value={owned != null ? String(owned) : '…'} />

      <button
        onClick={() => writeContract({ address: CERT_ADDRESS, abi: certAbi, functionName: 'mint' })}
        disabled={isPending || confirming}
        className="pdr-btn pdr-btn--primary"
        style={{ alignSelf: 'flex-start' }}
      >
        {isPending ? t('Konfirmasi di wallet…', 'Confirm in wallet…') : confirming ? t('Mencetak…', 'Minting…') : alreadyOwns ? t('Mint lagi', 'Mint again') : t('Mint sertifikat', 'Mint certificate')}
      </button>

      {error && (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--red)' }}>
          {error.message.includes('insufficient funds')
            ? t('Saldo gas kurang. Ambil ETH testnet di faucet (Lesson 2).', 'Not enough gas. Get testnet ETH from the faucet (Lesson 2).')
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
            'Sertifikat tercetak on-chain. Kamu menamatkan Pendar — dan menguasai alur lengkap dApp: connect, read, write, dan interaksi kontrak. Inilah skill yang dibayar sebagai frontend web3 developer.',
            'Certificate minted on-chain. You finished Pendar — and mastered the full dApp flow: connect, read, write, and contract interaction. This is the skill paid for as a frontend web3 developer.',
          )}
        </p>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.9rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <div style={{ ...box, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{children}</div>
}

const box: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 12,
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: 16,
}
