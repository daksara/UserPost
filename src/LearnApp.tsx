// src/LearnApp.tsx
//
// Entry point Pendar. Shell ini menyediakan header brand + navigasi antara
// dua bagian: "Belajar" (lesson web3) dan "Airdrop" (tracker airdrop).
//
// Provider yang membungkus:
//   • AuthProvider — status login (dipakai halaman Airdrop untuk simpan data)
//   • Web3Provider — wagmi/wallet (dipakai lesson web3)
import { useState } from 'react'
import { AuthProvider } from './hooks/useAuth'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Web3Provider } from './web3/Web3Provider'
import LearnPage from './pages/LearnPage'
import AirdropPage from './pages/AirdropPage'
import { Logo } from './components/Logo'

type View = 'learn' | 'airdrop'

function Shell() {
  const [view, setView] = useState<View>('learn')

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <header style={{
        borderBottom: '1px solid var(--border)', padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Logo size={22} />
          <strong style={{ fontSize: '1.05rem' }}>Pendar</strong>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>· Belajar Web3</span>
        </span>
        <nav style={{ display: 'flex', gap: 6 }}>
          <NavBtn label="Belajar" active={view === 'learn'} onClick={() => setView('learn')} />
          <NavBtn label="Airdrop" active={view === 'airdrop'} onClick={() => setView('airdrop')} />
        </nav>
      </header>

      {view === 'learn' ? <LearnPage /> : <AirdropPage active={view === 'airdrop'} />}
    </div>
  )
}

function NavBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 'none', cursor: 'pointer', borderRadius: 8, padding: '6px 12px',
        fontSize: '0.88rem', fontWeight: 700,
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent-dark)' : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  )
}

export default function LearnApp() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Web3Provider>
          <Shell />
        </Web3Provider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
