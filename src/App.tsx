// src/App.tsx
import { useState, useRef, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import FeedPage from './pages/FeedPage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'

type Tab = 'feed' | 'messages' | 'profile'

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

function App() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('feed')
  const [dmTarget, setDmTarget] = useState<string | undefined>()

  if (loading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner"/>
      </div>
    )
  }

  if (!user) return <AuthPage/>

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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
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
  return <AuthProvider><App/></AuthProvider>
}
