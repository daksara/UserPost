// src/pages/LearnPage.tsx
//
// Shell situs "Belajar Web3". Tiap lesson mengajarkan satu skill on-chain
// dengan cara MELAKUKANNYA langsung di browser — bukan sekadar membaca teori.
// Lesson 0 sudah hidup; sisanya placeholder yang akan kita isi satu per satu.
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectWallet } from '../web3/ConnectWallet'
import { ReadContract } from '../web3/ReadContract'
import { SendTransaction } from '../web3/SendTransaction'
import { TokenGate } from '../web3/TokenGate'
import { MintNFT } from '../web3/MintNFT'

interface Lesson {
  id: number
  title: string
  blurb: string
  ready: boolean
}

const LESSONS: Lesson[] = [
  { id: 0, title: 'Connect Wallet', blurb: 'Sambungkan MetaMask & baca address + saldo dari blockchain.', ready: true },
  { id: 1, title: 'Baca Data On-Chain', blurb: 'Panggil fungsi read sebuah smart contract dengan viem.', ready: true },
  { id: 2, title: 'Kirim Transaksi', blurb: 'Tanda tangani & kirim transaksi pertamamu di testnet.', ready: true },
  { id: 3, title: 'Token-Gated Content', blurb: 'Buka konten hanya untuk pemegang token tertentu.', ready: true },
  { id: 4, title: 'Mint Sertifikat NFT', blurb: 'Cetak NFT sebagai bukti kamu menyelesaikan kursus.', ready: true },
]

export default function LearnPage() {
  const [activeId, setActiveId] = useState(0)
  const active = LESSONS.find((l) => l.id === activeId)!

  return (
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
                color: l.id === activeId ? '#1a1206' : 'var(--text-muted)',
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
        <main key={active.id} className="pdr-rise" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20,
        }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.3rem' }}>
            Lesson {active.id}: {active.title}
          </h1>
          <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            {active.blurb}
          </p>
          {active.id === 0 ? <Lesson0 />
            : active.id === 1 ? <Lesson1 />
            : active.id === 2 ? <Lesson2 />
            : active.id === 3 ? <Lesson3 />
            : active.id === 4 ? <Lesson4 />
            : <p style={{ color: 'var(--text-muted)' }}>Lesson ini segera hadir.</p>}
        </main>
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
        <p className="pdr-rise" style={{
          margin: 0, padding: '12px 15px', borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-soft)', color: 'var(--accent)',
          fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.5,
          border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        }}>
          Selesai. Kamu baru saja menguasai skill web3 paling fundamental.
          Saldomu 0? Wajar — itu testnet kosong. Lesson berikutnya kita ambil
          token gratis dari faucet lalu kirim transaksi pertamamu.
        </p>
      )}
    </div>
  )
}

function Lesson1() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
        Membaca data dari blockchain itu <strong>gratis</strong> — tanpa gas,
        tanpa tanda tangan, bahkan tanpa wallet tersambung. Cukup bertanya ke
        node lewat RPC. Fungsi seperti ini disebut <em>read</em> (view/pure).
      </p>
      <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
        Di bawah, kita panggil 4 fungsi read standar <strong>ERC-20</strong> —
        <code> name()</code>, <code>symbol()</code>, <code>decimals()</code>,
        <code> totalSupply()</code> — pada kontrak <strong>WETH</strong> di Base
        Sepolia, plus nomor blok terbaru yang ter-update real-time. Semua datang
        langsung dari chain.
      </p>
      <ReadContract />
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Perhatikan: <code>totalSupply()</code> aslinya angka raksasa (wei). Kita
        bagi dengan <code>10^decimals</code> pakai <code>formatUnits</code> agar
        terbaca manusia — pola yang sama persis dengan saldo di Lesson 0.
      </p>
    </div>
  )
}

function Lesson2() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
        Sekarang kebalikan dari membaca: <strong>menulis</strong> ke blockchain
        lewat transaksi. Transaksi butuh <strong>gas</strong> (dibayar pakai ETH)
        dan <strong>tanda tangan</strong> wallet, lalu menunggu masuk blok.
      </p>
      <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
        Latihan paling aman: kirim <strong>0 ETH ke diri sendiri</strong>. Tetap
        transaksi nyata (kena gas, masuk explorer), tapi tak memindahkan dana.
        Ambil gas gratis dari faucet dulu.
      </p>
      <SendTransaction />
    </div>
  )
}

function Lesson3() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
        <strong>Token-gating</strong> = membuka konten/fitur hanya untuk wallet
        yang memenuhi syarat on-chain. Tak ada "akun premium" di server — cukup
        cek kepemilikan di blockchain. Ini fondasi komunitas berbayar & paywall web3.
      </p>
      <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
        Di sini gerbangnya: memegang ETH di Base Sepolia. Kalau saldomu &gt; 0
        (dari faucet Lesson 2), konten rahasia terbuka. Pola yang sama dipakai
        untuk gating berbasis token ERC-20 atau NFT.
      </p>
      <TokenGate />
    </div>
  )
}

function Lesson4() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
        Penutup: mencetak <strong>NFT sertifikat</strong> sebagai bukti kelulusan.
        Ini menggabungkan semuanya — connect, read (<code>balanceOf</code>), dan
        write ke fungsi spesifik kontrak (<code>mint</code>).
      </p>
      <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
        Sertifikatnya kontrak <strong>milikmu sendiri</strong>. Deploy ERC-721
        ringkas di bawah (pakai <a href="https://remix.ethereum.org" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>Remix</a> →
        jaringan Base Sepolia), lalu set alamatnya di <code>.env</code> sebagai{' '}
        <code>VITE_CERT_NFT_ADDRESS</code> dan deploy ulang situs.
      </p>
      <pre style={{
        margin: 0, padding: 14, borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-input)', border: '1px solid var(--border)',
        fontFamily: 'var(--font-mono)', fontSize: '0.74rem', lineHeight: 1.5,
        overflowX: 'auto', color: 'var(--text-secondary)',
      }}>{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract PendarCert is ERC721 {
    uint256 public nextId;
    constructor() ERC721("Pendar Certificate", "PNDR") {}
    function mint() external {
        _safeMint(msg.sender, nextId);
        nextId++;
    }
}`}</pre>
      <MintNFT />
    </div>
  )
}
