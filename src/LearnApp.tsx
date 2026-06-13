// src/LearnApp.tsx
//
// Entry point Pendar. Shell ini menyediakan header brand + navigasi antara
// dua bagian: "Belajar" (lesson web3) dan "Airdrop" (tracker airdrop), plus
// toggle bahasa ID/EN.
import { useState } from 'react'
import { AuthProvider } from './hooks/useAuth'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Web3Provider } from './web3/Web3Provider'
import { LangProvider, useLang, useT } from './i18n'
import LearnPage from './pages/LearnPage'
import AirdropPage from './pages/AirdropPage'
import { Logo } from './components/Logo'

type View = 'learn' | 'airdrop'

function Shell() {
  const [view, setView] = useState<View>('learn')
  const t = useT()

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <header style={{
        borderBottom: '1px solid var(--border)', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Logo size={22} />
          <strong style={{ fontSize: '1.05rem' }}>Pendar</strong>
        </span>
        <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <NavBtn label={t('Belajar', 'Learn')} active={view === 'learn'} onClick={() => setView('learn')} />
          <NavBtn label="Airdrop" active={view === 'airdrop'} onClick={() => setView('airdrop')} />
          <LangToggle />
        </nav>
      </header>

      {view === 'learn' ? <LearnPage /> : <AirdropPage active={view === 'airdrop'} />}
    </div>
  )
}

function NavBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`pdr-nav-btn${active ? ' pdr-nav-btn--active' : ''}`}>
      {label}
    </button>
  )
}

// Toggle bahasa ID | EN
function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', marginLeft: 4,
      border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden',
    }}>
      {(['id', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          style={{
            border: 'none', cursor: 'pointer', padding: '5px 10px',
            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.02em',
            background: lang === l ? 'var(--accent)' : 'transparent',
            color: lang === l ? '#1a1206' : 'var(--text-muted)',
            transition: 'background-color .2s ease, color .2s ease',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </span>
  )
}

export default function LearnApp() {
  return (
    <ErrorBoundary>
      <LangProvider>
        <AuthProvider>
          <Web3Provider>
            <Shell />
          </Web3Provider>
        </AuthProvider>
      </LangProvider>
    </ErrorBoundary>
  )
}
