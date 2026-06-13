// src/pages/LearnPage.tsx
//
// Shell situs "Belajar Web3" — dwibahasa (ID/EN). Tiap lesson mengajarkan satu
// skill on-chain dengan cara MELAKUKANNYA langsung di browser.
import { useState, useRef } from 'react'
import { useAccount } from 'wagmi'
import { Logo } from '../components/Logo'
import { useT, useLang } from '../i18n'
import { ConnectWallet } from '../web3/ConnectWallet'
import { ReadContract } from '../web3/ReadContract'
import { SendTransaction } from '../web3/SendTransaction'
import { TokenGate } from '../web3/TokenGate'
import { MintNFT } from '../web3/MintNFT'

interface Bi { id: string; en: string }
interface Lesson { id: number; title: Bi; blurb: Bi; ready: boolean }

const LESSONS: Lesson[] = [
  {
    id: 0, ready: true,
    title: { id: 'Connect Wallet', en: 'Connect Wallet' },
    blurb: { id: 'Sambungkan MetaMask & baca address + saldo dari blockchain.', en: 'Connect MetaMask & read your address + balance from the chain.' },
  },
  {
    id: 1, ready: true,
    title: { id: 'Baca Data On-Chain', en: 'Read On-Chain Data' },
    blurb: { id: 'Panggil fungsi read sebuah smart contract dengan viem.', en: "Call a smart contract's read functions with viem." },
  },
  {
    id: 2, ready: true,
    title: { id: 'Kirim Transaksi', en: 'Send a Transaction' },
    blurb: { id: 'Tanda tangani & kirim transaksi pertamamu di testnet.', en: 'Sign & send your first testnet transaction.' },
  },
  {
    id: 3, ready: true,
    title: { id: 'Token-Gated Content', en: 'Token-Gated Content' },
    blurb: { id: 'Buka konten hanya untuk pemegang token tertentu.', en: 'Unlock content only for holders of a given token.' },
  },
  {
    id: 4, ready: true,
    title: { id: 'Mint Sertifikat NFT', en: 'Mint NFT Certificate' },
    blurb: { id: 'Cetak NFT sebagai bukti kamu menyelesaikan kursus.', en: 'Mint an NFT as proof you finished the course.' },
  },
]

export default function LearnPage() {
  const [activeId, setActiveId] = useState(0)
  const active = LESSONS.find((l) => l.id === activeId)!
  const lessonsRef = useRef<HTMLDivElement>(null)
  const t = useT()
  const { lang } = useLang()

  const startLearning = () => {
    setActiveId(0)
    lessonsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 20 }}>
      <Hero onStart={startLearning} />
      <div ref={lessonsRef} style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr', marginTop: 28, scrollMarginTop: 70 }}>
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
                  {l.title[lang]} {!l.ready && <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{t('· segera', '· soon')}</span>}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l.blurb[lang]}</span>
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
            Lesson {active.id}: {active.title[lang]}
          </h1>
          <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            {active.blurb[lang]}
          </p>
          {active.id === 0 ? <Lesson0 />
            : active.id === 1 ? <Lesson1 />
            : active.id === 2 ? <Lesson2 />
            : active.id === 3 ? <Lesson3 />
            : active.id === 4 ? <Lesson4 />
            : null}
        </main>
      </div>
      <Outcomes />
    </div>
  )
}

function Outcomes() {
  const t = useT()
  const items: { title: string; desc: string }[] = [
    {
      title: t('Skill yang dibayar', 'In-demand skills'),
      desc: t('Connect wallet, baca & tulis on-chain, token-gating, deploy kontrak — stack wagmi + viem yang dipakai di lowongan nyata.', 'Connect wallet, on-chain read & write, token-gating, contract deploy — the wagmi + viem stack used in real jobs.'),
    },
    {
      title: t('Portfolio nyata', 'A real portfolio'),
      desc: t('Kamu membangun dApp utuh lima alur — bukti konkret yang bisa ditunjukkan ke employer atau klien.', 'You build a full five-flow dApp — concrete proof you can show employers or clients.'),
    },
    {
      title: t('Sertifikat on-chain', 'On-chain certificate'),
      desc: t('NFT sertifikat permanen di blockchain yang bisa diverifikasi siapa pun.', 'A permanent NFT certificate on the blockchain anyone can verify.'),
    },
    {
      title: t('Arah karier', 'A career path'),
      desc: t('Paket skill Frontend Web3 Developer (remote, sering dibayar USDC) — plus fondasi untuk jadi founder.', 'The Frontend Web3 Developer skill set (remote, often paid in USDC) — plus a foundation to become a founder.'),
    },
  ]
  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', letterSpacing: '-0.02em', textAlign: 'center' }}>
        {t('Setelah lulus', 'After you finish')}
      </h2>
      <p style={{ margin: '0 auto 20px', maxWidth: 460, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
        {t('Bukan sekadar tahu — kamu punya bukti dan arah.', 'Not just knowledge — you walk away with proof and direction.')}
      </p>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {items.map((it) => (
          <div key={it.title} className="pdr-card pdr-card--hover">
            <h3 style={{ margin: '0 0 6px', fontSize: '0.98rem', color: 'var(--accent)' }}>{it.title}</h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Hero({ onStart }: { onStart: () => void }) {
  const t = useT()
  const pills = ['Connect', 'Read', 'Transact', 'Token-gate', 'Mint']
  return (
    <section style={{ position: 'relative', textAlign: 'center', padding: '44px 16px 8px', overflow: 'hidden' }}>
      <div aria-hidden style={{
        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 340, height: 340, pointerEvents: 'none',
        background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 38%, transparent), transparent 68%)',
        filter: 'blur(24px)', animation: 'pdrGlow 3.5s ease-in-out infinite',
      }} />
      <div style={{ position: 'relative' }}>
        <div className="pdr-rise" style={{ display: 'inline-flex', marginBottom: 18 }}><Logo size={66} /></div>
        <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.85rem, 6vw, 2.6rem)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          {t('Kuasai Web3 ', 'Master Web3 ')}<span style={{ color: 'var(--accent)' }}>{t('sambil praktik', 'by doing')}</span>
        </h1>
        <p style={{ margin: '0 auto 22px', maxWidth: 460, color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
          {t(
            'Lima lesson interaktif — dari connect wallet sampai mint NFT — semua dikerjakan langsung on-chain di browser. Bukan teori.',
            'Five interactive lessons — from connecting a wallet to minting an NFT — all done on-chain in your browser. Not theory.',
          )}
        </p>
        <button className="pdr-btn pdr-btn--primary" onClick={onStart} style={{ fontSize: '0.95rem', padding: '12px 24px' }}>
          {t('Mulai belajar', 'Start learning')}
        </button>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
          {pills.map((p) => (
            <span key={p} style={{
              fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '5px 13px',
            }}>{p}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

const P: React.CSSProperties = { margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }
const PMuted: React.CSSProperties = { margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }

function Lesson0() {
  const { isConnected } = useAccount()
  const { lang } = useLang()
  const t = useT()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {lang === 'en' ? (
        <>
          <p style={P}>A <strong>wallet</strong> is your identity in web3 — the replacement for email & password. Connecting it lets this app <em>read</em> your public address (and later request transaction signatures). The app never sees your private key.</p>
          <p style={P}>Click the button below. MetaMask will pop up for approval. Once connected, you'll see your address & balance on <strong>Base Sepolia</strong> (testnet) — read straight from the blockchain.</p>
        </>
      ) : (
        <>
          <p style={P}>Sebuah <strong>wallet</strong> adalah identitasmu di web3 — pengganti email &amp; password. Menyambungkan wallet artinya memberi izin app ini untuk <em>membaca</em> address publikmu (dan nanti meminta tanda tangan transaksi). App tidak pernah melihat private key-mu.</p>
          <p style={P}>Klik tombol di bawah. MetaMask akan muncul minta persetujuan. Setelah tersambung, kamu akan lihat address &amp; saldomu di jaringan <strong>Base Sepolia</strong> (testnet) — dibaca langsung dari blockchain.</p>
        </>
      )}
      <ConnectWallet />
      {isConnected && (
        <p className="pdr-rise" style={{
          margin: 0, padding: '12px 15px', borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: '0.9rem',
          fontWeight: 600, lineHeight: 1.5, border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        }}>
          {t(
            'Selesai. Kamu baru saja menguasai skill web3 paling fundamental. Saldomu 0? Wajar — itu testnet kosong. Lesson berikutnya kita ambil token gratis dari faucet lalu kirim transaksi pertamamu.',
            "Done. You just learned the most fundamental web3 skill. Balance 0? Normal — it's an empty testnet. Next lesson we grab free tokens from a faucet and send your first transaction.",
          )}
        </p>
      )}
    </div>
  )
}

function Lesson1() {
  const { lang } = useLang()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {lang === 'en' ? (
        <>
          <p style={P}>Reading data from the blockchain is <strong>free</strong> — no gas, no signature, not even a connected wallet. You just ask a node via RPC. These are called <em>read</em> functions (view/pure).</p>
          <p style={P}>Below we call 4 standard <strong>ERC-20</strong> read functions — <code>name()</code>, <code>symbol()</code>, <code>decimals()</code>, <code>totalSupply()</code> — on the <strong>WETH</strong> contract on Base Sepolia, plus the latest block number updating in real time.</p>
        </>
      ) : (
        <>
          <p style={P}>Membaca data dari blockchain itu <strong>gratis</strong> — tanpa gas, tanpa tanda tangan, bahkan tanpa wallet tersambung. Cukup bertanya ke node lewat RPC. Fungsi seperti ini disebut <em>read</em> (view/pure).</p>
          <p style={P}>Di bawah, kita panggil 4 fungsi read standar <strong>ERC-20</strong> — <code>name()</code>, <code>symbol()</code>, <code>decimals()</code>, <code>totalSupply()</code> — pada kontrak <strong>WETH</strong> di Base Sepolia, plus nomor blok terbaru yang ter-update real-time.</p>
        </>
      )}
      <ReadContract />
      <p style={PMuted}>
        {lang === 'en'
          ? <><code>totalSupply()</code> is originally a huge integer (wei). We divide by <code>10^decimals</code> with <code>formatUnits</code> to make it human-readable — same pattern as the balance in Lesson 0.</>
          : <>Perhatikan: <code>totalSupply()</code> aslinya angka raksasa (wei). Kita bagi dengan <code>10^decimals</code> pakai <code>formatUnits</code> agar terbaca manusia — pola yang sama persis dengan saldo di Lesson 0.</>}
      </p>
    </div>
  )
}

function Lesson2() {
  const { lang } = useLang()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {lang === 'en' ? (
        <>
          <p style={P}>Now the opposite of reading: <strong>writing</strong> to the blockchain via a transaction. Transactions cost <strong>gas</strong> (paid in ETH) and need a wallet <strong>signature</strong>, then wait to be included in a block.</p>
          <p style={P}>The safest practice: send <strong>0 ETH to yourself</strong>. Still a real transaction (costs gas, appears on the explorer) but moves no funds. Grab free gas from the faucet first.</p>
        </>
      ) : (
        <>
          <p style={P}>Sekarang kebalikan dari membaca: <strong>menulis</strong> ke blockchain lewat transaksi. Transaksi butuh <strong>gas</strong> (dibayar pakai ETH) dan <strong>tanda tangan</strong> wallet, lalu menunggu masuk blok.</p>
          <p style={P}>Latihan paling aman: kirim <strong>0 ETH ke diri sendiri</strong>. Tetap transaksi nyata (kena gas, masuk explorer), tapi tak memindahkan dana. Ambil gas gratis dari faucet dulu.</p>
        </>
      )}
      <SendTransaction />
    </div>
  )
}

function Lesson3() {
  const { lang } = useLang()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {lang === 'en' ? (
        <>
          <p style={P}><strong>Token-gating</strong> means unlocking content/features only for wallets that meet an on-chain condition. There's no "premium account" on a server — you just check ownership on the blockchain. This is the foundation of paid communities & web3 paywalls.</p>
          <p style={P}>Here the gate is: holding ETH on Base Sepolia. If your balance &gt; 0 (from the Lesson 2 faucet), the secret content unlocks. The same pattern works for ERC-20 token or NFT gating.</p>
        </>
      ) : (
        <>
          <p style={P}><strong>Token-gating</strong> = membuka konten/fitur hanya untuk wallet yang memenuhi syarat on-chain. Tak ada "akun premium" di server — cukup cek kepemilikan di blockchain. Ini fondasi komunitas berbayar &amp; paywall web3.</p>
          <p style={P}>Di sini gerbangnya: memegang ETH di Base Sepolia. Kalau saldomu &gt; 0 (dari faucet Lesson 2), konten rahasia terbuka. Pola yang sama dipakai untuk gating berbasis token ERC-20 atau NFT.</p>
        </>
      )}
      <TokenGate />
    </div>
  )
}

function Lesson4() {
  const { lang } = useLang()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {lang === 'en' ? (
        <>
          <p style={P}>The finale: minting an <strong>NFT certificate</strong> as proof of completion. It combines everything — connect, read (<code>balanceOf</code>), and writing to a contract's specific function (<code>mint</code>).</p>
          <p style={P}>The certificate is <strong>your own contract</strong>, with <strong>fully on-chain art &amp; metadata</strong> (the SVG is generated inside the contract) — so it looks great in wallets/explorers with no server. Deploy via <a href="https://remix.ethereum.org" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>Remix</a> → Base Sepolia, then set <code>VITE_CERT_NFT_ADDRESS</code> in <code>.env</code> and redeploy.</p>
        </>
      ) : (
        <>
          <p style={P}>Penutup: mencetak <strong>NFT sertifikat</strong> sebagai bukti kelulusan. Ini menggabungkan semuanya — connect, read (<code>balanceOf</code>), dan write ke fungsi spesifik kontrak (<code>mint</code>).</p>
          <p style={P}>Sertifikatnya kontrak <strong>milikmu sendiri</strong>, dengan <strong>gambar &amp; metadata 100% on-chain</strong> (SVG di-generate di dalam kontrak) — jadi tampil cantik di wallet/explorer tanpa server. Deploy via <a href="https://remix.ethereum.org" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>Remix</a> → Base Sepolia, lalu set <code>VITE_CERT_NFT_ADDRESS</code> di <code>.env</code> dan deploy ulang.</p>
        </>
      )}
      <pre style={{
        margin: 0, padding: 14, borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-input)', border: '1px solid var(--border)',
        fontFamily: 'var(--font-mono)', fontSize: '0.72rem', lineHeight: 1.5,
        overflowX: 'auto', color: 'var(--text-secondary)',
      }}>{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract PendarCert is ERC721 {
    using Strings for uint256;
    uint256 public nextId;
    constructor() ERC721("Pendar Certificate", "PNDR") {}

    function mint() external {
        _safeMint(msg.sender, nextId);
        nextId++;
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        require(_ownerOf(id) != address(0), "no token");
        string memory svg = string(abi.encodePacked(
          '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">',
          '<rect width="600" height="400" fill="#0e0e11"/>',
          '<g stroke="#f0a93b" stroke-width="6" stroke-linecap="round">',
          '<line x1="300" y1="118" x2="300" y2="82"/><line x1="300" y1="182" x2="300" y2="218"/>',
          '<line x1="268" y1="150" x2="232" y2="150"/><line x1="332" y1="150" x2="368" y2="150"/></g>',
          '<circle cx="300" cy="150" r="15" fill="#f0a93b"/>',
          '<text x="300" y="280" fill="#f4f1ea" font-size="30" font-family="sans-serif"',
          ' text-anchor="middle" font-weight="bold">Pendar Certificate</text>',
          '<text x="300" y="318" fill="#86837a" font-size="18" font-family="sans-serif"',
          ' text-anchor="middle">Belajar Web3 &#8226; #', id.toString(), '</text></svg>'
        ));
        string memory json = Base64.encode(bytes(abi.encodePacked(
          '{"name":"Pendar Certificate #', id.toString(),
          '","description":"Bukti menamatkan Belajar Web3 di Pendar.",',
          '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
        )));
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}`}</pre>
      <MintNFT />
    </div>
  )
}
