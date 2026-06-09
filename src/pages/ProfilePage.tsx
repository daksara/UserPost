// src/pages/ProfilePage.tsx
import { useState, useRef } from 'react'
import { signOut, updateProfile, changePassword } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { getAvatarUrl } from '../components/Avatar'

async function compressToBase64(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = url
  })
}

function hashStr(s: string) {
  let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xfffff; return h
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        background: copied ? 'var(--green)' : 'var(--accent)',
        color: '#fff',
        border: 'none',
        borderRadius: 'var(--radius-xs)',
        padding: '5px 12px',
        fontSize: '0.75rem',
        fontWeight: 700,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.15s',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Change password
  const [changingPw, setChangingPw] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  // Edit fields
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [twitter, setTwitter] = useState('')
  const [telegram, setTelegram] = useState('')
  const [tipCA, setTipCA] = useState('')

  if (!profile) return null

  const handleChangePassword = async () => {
    setPwError('')
    if (!currentPw || !newPw || !confirmPw) { setPwError('All fields required'); return }
    if (newPw.length < 6) { setPwError('New password min 6 characters'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    setSavingPw(true)
    try {
      await changePassword(currentPw, newPw)
      setPwSuccess(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => { setPwSuccess(false); setChangingPw(false) }, 2000)
    } catch (e: any) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setPwError('Current password is incorrect')
      } else {
        setPwError('Failed to change password. Try again.')
      }
    } finally {
      setSavingPw(false)
    }
  }


  const avatarSrc = (profile as any).photo_url || getAvatarUrl(profile.username)

  const openEdit = () => {
    setPhotoUrl((profile as any).photo_url || '')
    setPhotoPreview(null)
    setBio((profile as any).bio || '')
    setTwitter((profile as any).twitter || '')
    setTelegram((profile as any).telegram || '')
    setTipCA((profile as any).tip_ca || '')
    setError('')
    setEditing(true)
  }

  const handlePickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await compressToBase64(file)
      setPhotoPreview(base64)
      setPhotoUrl(base64)
    } catch {
      setError('Failed to process image.')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await updateProfile(profile.id, {
        photo_url: photoUrl.trim() || null,
        bio: bio.trim() || null,
        twitter: twitter.trim() || null,
        telegram: telegram.trim() || null,
        tip_ca: tipCA.trim() || null,
      })
      await refreshProfile()
      setEditing(false)
    } catch (e: any) {
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

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

      <div className="profile-body" style={{ overflowY: 'auto' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', marginBottom: 4 }}>
          <img
            src={avatarSrc}
            alt={profile.username}
            className="profile-avatar-img"
            onError={(e) => {
              const img = e.currentTarget
              img.style.display = 'none'
              const fallback = img.nextElementSibling as HTMLElement | null
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          <div className="profile-avatar" style={{ background: `hsl(${hue},60%,65%)`, display: 'none' }}>
            {profile.username[0].toUpperCase()}
          </div>
          {/* Edit button overlay */}
          <button
            onClick={openEdit}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent)', border: '2px solid var(--bg-card)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>

        {/* Username */}
        <div className="profile-username">
          {profile.username}
          {profile.is_verified && (
            <span className="badge-official">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 3 }}>
                <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
              Official
            </span>
          )}
        </div>

        {/* Bio */}
        {(profile as any).bio && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
            {(profile as any).bio}
          </p>
        )}

        <div className="profile-joined">
          Joined {new Date(profile.created_at).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
        </div>

        {/* Social links */}
        {((profile as any).twitter || (profile as any).telegram) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4 }}>
            {(profile as any).twitter && (
              <a
                href={`https://twitter.com/${(profile as any).twitter.replace('@','')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                {(profile as any).twitter}
              </a>
            )}
            {(profile as any).telegram && (
              <a
                href={`https://t.me/${(profile as any).telegram.replace('@','')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.28l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.279z"/></svg>
                {(profile as any).telegram}
              </a>
            )}
          </div>
        )}

        {/* Tip Contract Address */}
        {(profile as any).tip_ca && (
          <div style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              💰 Tip / Contract Address
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                color: 'var(--text-primary)', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {(profile as any).tip_ca}
              </span>
              <CopyButton text={(profile as any).tip_ca} />
            </div>
          </div>
        )}

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

        <button
          className="signout-btn"
          onClick={() => { setChangingPw(true); setPwError(''); setPwSuccess(false) }}
          style={{ color: 'var(--accent)', marginBottom: 0 }}
        >
          Change Password
        </button>
        <button className="signout-btn" onClick={signOut}>Sign out</button>
      </div>

      {/* ── Change Password Sheet ── */}
      {changingPw && (
        <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) setChangingPw(false) }}>
          <div className="sheet" style={{ gap: 12 }}>
            <div className="sheet__handle"/>
            <div className="sheet__title">Change Password</div>

            <label style={labelStyle}>Current Password</label>
            <input className="auth-input" type="password" placeholder="••••••••" value={currentPw} onChange={e => { setCurrentPw(e.target.value); setPwError('') }}/>

            <label style={labelStyle}>New Password</label>
            <input className="auth-input" type="password" placeholder="min 6 characters" value={newPw} onChange={e => { setNewPw(e.target.value); setPwError('') }}/>

            <label style={labelStyle}>Confirm New Password</label>
            <input className="auth-input" type="password" placeholder="••••••••" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setPwError('') }}/>

            {pwError && <p style={{ color: 'var(--red)', fontSize: '0.8rem' }}>{pwError}</p>}
            {pwSuccess && <p style={{ color: 'var(--green)', fontSize: '0.8rem', fontWeight: 700 }}>Password changed successfully!</p>}

            <button className="auth-btn" onClick={handleChangePassword} disabled={savingPw}>
              {savingPw ? <span className="spinner spinner--sm"/> : 'Save Password'}
            </button>
          </div>
        </div>
      )}


      {editing && (
        <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) setEditing(false) }}>
          <div className="sheet" style={{ gap: 12 }}>
            <div className="sheet__handle"/>
            <div className="sheet__title">Edit Profile</div>

            {/* Photo picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePickPhoto}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <img
                src={photoPreview || photoUrl || getAvatarUrl(profile.username)}
                alt="preview"
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', background: '#eeeeff', border: '2px solid var(--border)' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarUrl(profile.username) }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  border: '1.5px solid var(--accent)', borderRadius: 'var(--radius-full)',
                  padding: '6px 16px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Choose from Gallery
              </button>
            </div>

            <label style={labelStyle}>Bio</label>
            <textarea
              className="auth-input"
              placeholder="Tell people about yourself…"
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 160))}
              rows={3}
              style={{ resize: 'none' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: -8 }}>{bio.length}/160</span>

            <label style={labelStyle}>Twitter / X</label>
            <input className="auth-input" placeholder="@username" value={twitter} onChange={e => setTwitter(e.target.value)} autoCapitalize="none"/>

            <label style={labelStyle}>Telegram</label>
            <input className="auth-input" placeholder="@username" value={telegram} onChange={e => setTelegram(e.target.value)} autoCapitalize="none"/>

            <label style={labelStyle}>Tip / Contract Address</label>
            <input className="auth-input" placeholder="0x... or wallet address" value={tipCA} onChange={e => setTipCA(e.target.value)} autoCapitalize="none"/>

            {error && <p style={{ color: 'var(--red)', fontSize: '0.8rem' }}>{error}</p>}

            <button className="auth-btn" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner spinner--sm"/> : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: -6,
}
