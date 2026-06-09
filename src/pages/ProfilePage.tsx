// src/pages/ProfilePage.tsx
// Perubahan: import signOut dari '../lib/firebase' (bukan supabase)

import { signOut } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

function hashStr(s: string) {
  let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xfffff; return h
}

export default function ProfilePage() {
  const { profile } = useAuth()
  if (!profile) return null

  const hue = hashStr(profile.username) % 360

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header__title">Profile</h1>
        <button className="icon-btn icon-btn--muted" onClick={signOut} title="Sign out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </header>

      <div className="profile-body">
        <div className="profile-avatar" style={{ background: `hsl(${hue},60%,65%)` }}>
          {profile.username[0].toUpperCase()}
        </div>
        <div className="profile-username">
          {profile.username}
          {profile.is_verified && (
            <span className="badge-official">Official</span>
          )}
        </div>
        <div className="profile-joined">Joined {new Date(profile.created_at).toLocaleDateString('en', { month: 'long', year: 'numeric' })}</div>

        <div className="profile-info-card">
          <div className="profile-info-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Posts disappear after 24 hours
          </div>
          <div className="profile-info-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Messages are private and persistent
          </div>
        </div>

        <button className="signout-btn" onClick={signOut}>Sign out</button>
      </div>
    </div>
  )
}
