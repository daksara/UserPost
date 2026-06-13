# Pendar

**Belajar Web3 sambil praktik.** Platform belajar interaktif (dwibahasa ID/EN)
di mana tiap lesson mengajarkan satu skill web3 dengan **melakukannya langsung
on-chain di browser** — bukan teori. Selesai kursus, kamu punya skill, portfolio,
dan **sertifikat NFT on-chain**.

> Repo ini sebelumnya bernama "UserPost" (social feed). Kode app sosial lama
> masih ada untuk rujukan (`src/App.tsx`, `src/pages/{Feed,Messages,Profile}Page.tsx`,
> `src/lib/firebase.ts`); entry point sekarang `src/LearnApp.tsx`.

## Kurikulum

| Lesson | Skill | Widget |
|---|---|---|
| 0 · Connect Wallet | connect, baca address/saldo, switch network | `web3/ConnectWallet.tsx` |
| 1 · Read On-Chain Data | `useReadContracts` (ERC-20) + `useBlockNumber` | `web3/ReadContract.tsx` |
| 2 · Send a Transaction | faucet + `useSendTransaction` + tunggu receipt | `web3/SendTransaction.tsx` |
| 3 · Token-Gated Content | buka konten berdasar kepemilikan on-chain | `web3/TokenGate.tsx` |
| 4 · Mint NFT Certificate | `useWriteContract` ke ERC-721 milik sendiri | `web3/MintNFT.tsx` |

Plus **Airdrop Tracker**: tempel teks airdrop dari grup → diparsing otomatis
jadi tracker tugas terstruktur (butuh login, tersimpan di Firebase).

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Web3**: wagmi v3 + viem — target chain **Base Sepolia** (testnet)
- **i18n**: layer ringan buatan sendiri (`src/i18n.tsx`), ID/EN
- **Backend** (untuk Airdrop Tracker & app sosial lama): Firebase
- **Hosting**: Vercel

---

## Menjalankan lokal

```bash
cp .env.example .env     # isi nilainya (lihat di bawah)
npm install
npm run dev
```

Lesson web3 (0–3) jalan tanpa konfigurasi apa pun selain wallet
([MetaMask](https://metamask.io/download/)) di jaringan Base Sepolia.

### Environment variables (`.env`)
- `VITE_FIREBASE_*` — wajib untuk **Airdrop Tracker** (login & simpan data).
  Buat project di [Firebase Console](https://console.firebase.google.com) →
  Authentication (Email/Password) + Firestore → copy config web app.
- `VITE_CERT_NFT_ADDRESS` — alamat kontrak sertifikat untuk **Lesson 4**
  (lihat panduan deploy di bawah). Kosongkan kalau belum deploy.

### Firestore rules (untuk Airdrop Tracker)
Deploy `firestore.rules` (minimal blok `match /airdrops/{...}`) — Firebase
Console → Firestore → Rules → paste → Publish. Tanpa ini, simpan airdrop ditolak.

---

## Deploy kontrak Sertifikat (Lesson 4)

Sertifikatnya kontrak **milikmu sendiri**, dengan gambar & metadata 100%
on-chain (SVG di-generate di `tokenURI`). Sumber lengkap ada di dalam Lesson 4.

1. Buka [remix.ethereum.org](https://remix.ethereum.org) → buat `PendarCert.sol`
   → paste kontrak dari Lesson 4.
2. **Solidity Compiler** → versi `0.8.20`+ → Compile (Remix auto-resolve import OpenZeppelin).
3. **Deploy & Run** → Environment **Injected Provider – MetaMask** → pastikan
   MetaMask di **Base Sepolia** dengan ETH faucet untuk gas.
4. Deploy `PendarCert` → konfirmasi → copy alamat kontrak.
5. Set `VITE_CERT_NFT_ADDRESS=<alamat>` di `.env` (atau Vercel → Settings →
   Environment Variables) → redeploy. Tombol mint di Lesson 4 langsung aktif.

> Faucet Base Sepolia: <https://www.alchemy.com/faucets/base-sepolia>

---

## Quality checks
```bash
npm run lint   # ESLint
npm test       # Vitest (termasuk test parser airdrop)
npm run build  # typecheck + production build
```
CI (GitHub Actions) menjalankan ketiganya di tiap push & PR.

## Deploy ke Vercel
```bash
npm install -g vercel
vercel
# Tambahkan VITE_FIREBASE_* dan (opsional) VITE_CERT_NFT_ADDRESS sebagai env vars
```

## Struktur proyek (Pendar)
```
src/
  LearnApp.tsx           # Entry point: shell + nav Belajar/Airdrop + toggle ID/EN
  i18n.tsx               # LangProvider + useT (dwibahasa)
  components/Logo.tsx    # Logo Pendar (mark berpendar)
  pages/
    LearnPage.tsx        # Hero + daftar lesson + isi lesson + "Setelah lulus"
    AirdropPage.tsx      # Airdrop tracker (login, paste→parse, checklist)
  web3/
    config.ts            # wagmi config (Base Sepolia, injected)
    Web3Provider.tsx     # WagmiProvider + React Query
    ConnectWallet.tsx    # Lesson 0
    ReadContract.tsx     # Lesson 1
    SendTransaction.tsx  # Lesson 2
    TokenGate.tsx        # Lesson 3
    MintNFT.tsx          # Lesson 4
  lib/airdropParser.ts   # Parser teks airdrop (+ test)
firestore.rules          # Rules (termasuk /airdrops)
```
