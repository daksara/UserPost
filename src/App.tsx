// src/App.tsx
import { useState, useRef, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import FeedPage from './pages/FeedPage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { subscribeToInbox, getUnreadCount, resendVerificationEmail, signOut as fbSignOut, auth } from './lib/firebase'

type Tab = 'feed' | 'messages' | 'profile'

const TABS: Tab[] = ['feed', 'messages', 'profile']

function tabFromHash(): Tab {
  const h = location.hash.replace('#', '')
  return (TABS as string[]).includes(h) ? (h as Tab) : 'feed'
}

// Animasi fade+slide ringan — hanya opacity & translateY, tidak ubah layout
function AnimatedTab({ children, active }: { children: React.ReactNode; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (!mounted.current) {
      // Mount pertama: langsung tampil tanpa animasi
      mounted.current = true
      el.style.opacity = active ? '1' : '0'
      el.style.pointerEvents = active ? 'auto' : 'none'
      el.style.visibility = active ? 'visible' : 'hidden'
      return
    }

    if (active) {
      el.style.visibility = 'visible'
      el.style.pointerEvents = 'auto'
      el.style.transform = 'translateY(6px)'
      el.style.opacity = '0'
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.2s ease, transform 0.2s ease'
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      })
    } else {
      el.style.transition = 'none'
      el.style.opacity = '0'
      el.style.pointerEvents = 'none'
      // Delay hide agar tidak terpotong saat animasi masuk tab baru
      setTimeout(() => {
        if (ref.current) ref.current.style.visibility = 'hidden'
      }, 50)
    }
  }, [active])

  return (
    <div
      ref={ref}
      style={{
        // Semua tab stack di posisi yang sama — tidak ubah document flow
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        visibility: active ? 'visible' : 'hidden',
        opacity: 0,
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  )
}

function VerifyEmailGate({ onVerified }: { onVerified: () => void }) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleResend = async () => {
    setSending(true); setError(''); setSent(false)
    try {
      await resendVerificationEmail()
      setSent(true)
    } catch {
      setError('Failed to send. Wait a moment and try again.')
    } finally { setSending(false) }
  }

  const handleCheck = async () => {
    setChecking(true); setError('')
    try {
      await auth.currentUser?.reload()
      if (auth.currentUser?.emailVerified) {
        onVerified()
      } else {
        setError("Email not verified yet. Check your inbox (including spam).")
      }
    } catch {
      setError('Could not check status. Try again.')
    } finally { setChecking(false) }
  }

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '0 24px',
      background: 'var(--bg)', gap: 12,
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 4 }}>✉️</div>
      <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>
        Verify your email
      </h2>
      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 320 }}>
        We sent a verification link to <strong style={{ color: 'var(--text-primary)' }}>{auth.currentUser?.email}</strong>.
        Click the link to activate your account.
      </p>
      {error && (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--red)', textAlign: 'center' }}>{error}</p>
      )}
      {sent && !error && (
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#22c55e', textAlign: 'center' }}>Verification email sent!</p>
      )}
      <button
        className="auth-btn"
        style={{ marginTop: 8, width: '100%', maxWidth: 320 }}
        onClick={handleCheck}
        disabled={checking}
      >
        {checking ? <span className="spinner"/> : "I've verified my email"}
      </button>
      <button
        onClick={handleResend}
        disabled={sending}
        style={{
          background: 'none', border: 'none', color: 'var(--accent)',
          fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '4px 0',
        }}
      >
        {sending ? 'Sending…' : 'Resend verification email'}
      </button>
      <button
        onClick={() => fbSignOut()}
        style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          fontSize: '0.8rem', cursor: 'pointer', padding: '4px 0',
        }}
      >
        Sign out
      </button>
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const [dmTarget, setDmTarget] = useState<string | undefined>()
  const [unreadCount, setUnreadCount] = useState(0)
  const [emailVerified, setEmailVerified] = useState<boolean>(() => user?.emailVerified ?? true)

  // Sync emailVerified when user object changes
  useEffect(() => {
    if (user) setEmailVerified(user.emailVerified)
  }, [user])

  // Subscribe to inbox for unread badge
  useEffect(() => {
    if (!user) return
    // Get initial count
    getUnreadCount(user.uid).then(setUnreadCount).catch(() => {})
    // Then subscribe to live updates
    const unsub = subscribeToInbox(user.uid, async () => {
      const count = await getUnreadCount(user.uid).catch(() => 0)
      setUnreadCount(count)
    })
    return () => unsub()
  }, [user?.uid])

  // Clear badge when user opens messages tab
  useEffect(() => {
    if (tab === 'messages') setUnreadCount(0)
  }, [tab])

  // Keep the active tab in the URL hash (deep-linking + back button)
  useEffect(() => {
    if (location.hash !== `#${tab}`) history.replaceState(null, '', `#${tab}`)
  }, [tab])

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (loading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner"/>
      </div>
    )
  }

  if (!user) return <AuthPage/>

  // Show email verification gate for non-legacy users
  const isLegacy = user.email?.endsWith('@userpost.app') ?? false
  if (!emailVerified && !isLegacy) {
    return <VerifyEmailGate onVerified={() => setEmailVerified(true)}/>
  }

  const handleDMClick = (username: string) => {
    setDmTarget(username)
    setTab('messages')
  }

  return (
    <div className="app">
      {/* position:relative agar absolute children bisa stack dengan benar */}
      <div className="app__content" style={{ position: 'relative' }}>
        <AnimatedTab active={tab === 'feed'}>
          <FeedPage onDMClick={handleDMClick}/>
        </AnimatedTab>
        <AnimatedTab active={tab === 'messages'}>
          <MessagesPage key={dmTarget ?? 'messages'} initialDM={dmTarget}/>
        </AnimatedTab>
        <AnimatedTab active={tab === 'profile'}>
          <ProfilePage/>
        </AnimatedTab>
      </div>

      <nav className="bottom-nav">
        <button
          className={`bottom-nav__item ${tab === 'feed' ? 'bottom-nav__item--active' : ''}`}
          onClick={() => setTab('feed')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Feed</span>
        </button>
        <button
          className={`bottom-nav__item ${tab === 'messages' ? 'bottom-nav__item--active' : ''}`}
          onClick={() => { setDmTarget(undefined); setTab('messages') }}
        >
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -6,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                background: 'var(--red, #ef4444)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                lineHeight: 1,
                border: '1.5px solid var(--bg)',
                pointerEvents: 'none',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span>Messages</span>
        </button>
        <button
          className={`bottom-nav__item ${tab === 'profile' ? 'bottom-nav__item--active' : ''}`}
          onClick={() => setTab('profile')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  )
}

export default function Root() {
  return (
    <ErrorBoundary>
      <AuthProvider><App/></AuthProvider>
    </ErrorBoundary>
  )
}
