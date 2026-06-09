// src/App.tsx
// Perubahan: useAuth sekarang return { user, profile, loading }
// Ganti 'session' → 'user'

import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import FeedPage from './pages/FeedPage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'

type Tab = 'feed' | 'messages' | 'profile'

function App() {
  const { user, loading } = useAuth()  // 'user' bukan 'session'
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
      <div className="app__content">
        {tab === 'feed'     && <FeedPage onDMClick={handleDMClick}/>}
        {tab === 'messages' && <MessagesPage key={dmTarget ?? 'messages'} initialDM={dmTarget}/>}
        {tab === 'profile'  && <ProfilePage/>}
      </div>

      <nav className="bottom-nav">
        <button className={`bottom-nav__item ${tab === 'feed' ? 'bottom-nav__item--active' : ''}`} onClick={() => setTab('feed')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Feed</span>
        </button>
        <button className={`bottom-nav__item ${tab === 'messages' ? 'bottom-nav__item--active' : ''}`} onClick={() => { setDmTarget(undefined); setTab('messages') }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Messages</span>
        </button>
        <button className={`bottom-nav__item ${tab === 'profile' ? 'bottom-nav__item--active' : ''}`} onClick={() => setTab('profile')}>
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
