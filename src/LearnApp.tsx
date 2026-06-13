// src/LearnApp.tsx
//
// Entry point situs "Belajar Web3". Membungkus halaman belajar dengan
// Web3Provider (wagmi) supaya semua lesson punya akses ke wallet & blockchain.
import { ErrorBoundary } from './components/ErrorBoundary'
import { Web3Provider } from './web3/Web3Provider'
import LearnPage from './pages/LearnPage'

export default function LearnApp() {
  return (
    <ErrorBoundary>
      <Web3Provider>
        <LearnPage />
      </Web3Provider>
    </ErrorBoundary>
  )
}
