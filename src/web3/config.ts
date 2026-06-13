// src/web3/config.ts
//
// Konfigurasi wagmi — "otak" dari semua interaksi web3 di app ini.
//
// Tiga hal yang didefinisikan di sini, dan ketiganya adalah konsep inti
// yang HARUS kamu pahami sebagai web3 developer:
//
//   1. chains    — blockchain mana yang app ini bicara dengannya.
//                  Kita pakai Base Sepolia: testnet (uang mainan, gratis),
//                  jadi aman buat belajar tanpa risiko kehilangan dana asli.
//   2. connectors — cara user menyambungkan wallet-nya. `injected` =
//                   wallet yang "disuntikkan" ke browser (MetaMask, Rabby, dll).
//   3. transports — bagaimana app membaca data dari blockchain. `http()`
//                    memakai RPC endpoint publik bawaan chain-nya.
import { createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    // Tiap chain butuh transport-nya sendiri. http() tanpa argumen memakai
    // RPC publik default Base Sepolia — cukup untuk belajar. Untuk produksi
    // kamu akan ganti dengan RPC khusus (Alchemy/Infura) lewat http('https://…').
    [baseSepolia.id]: http(),
  },
})

// wagmi butuh tipe config-nya teregistrasi secara global agar hook seperti
// useAccount/useBalance tahu chain & connector apa yang tersedia (full type-safety).
declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
