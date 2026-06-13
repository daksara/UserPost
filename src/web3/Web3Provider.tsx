// src/web3/Web3Provider.tsx
//
// Membungkus app dengan dua provider yang dibutuhkan wagmi:
//
//   • WagmiProvider     — menyediakan config (chain, connector, transport)
//                         ke semua hook web3 di pohon komponen.
//   • QueryClientProvider — wagmi memakai TanStack Query di balik layar untuk
//                           caching & refetch data on-chain (saldo, dll), jadi
//                           panggilan RPC tidak diulang terus-menerus.
//
// Pola "provider membungkus app" ini adalah pola standar di hampir semua
// dApp React — begitu kamu paham ini, kamu paham fondasi semua frontend web3.
import type { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './config'

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
