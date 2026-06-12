// src/pages/ProfilePage.tsx
import { useState, useRef, useEffect } from 'react'
import {
  signOut, updateProfile, changePassword, deleteAccount, uploadProfilePhoto,
  getMyActivePosts, deletePost, getMessageStats, type Post,
} from '../lib/firebase'
import { expiresIn } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import { getAvatarUrl } from '../components/Avatar'
import { BadgeChip } from '../components/Badge'

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

export default function ProfilePage({ active = true }: { active?: boolean }) {
  const { profile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Foto baru (base64) ditampilkan di avatar selagi upload berjalan di
  // belakang — ditahan sampai URL hasil upload selesai diunduh browser
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Change password
  const [changingPw, setChangingPw] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  // Delete account
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletingLoading, setDeletingLoading] = useState(false)

  // Edit fields
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [twitter, setTwitter] = useState('')
  const [telegram, setTelegram] = useState('')
  const [tipCA, setTipCA] = useState('')

  // My posts & stats pesan — null = masih loading
  const [myPosts, setMyPosts] = useState<Post[] | null>(null)
  const [msgStats, setMsgStats] = useState<{ sent: number; received: number } | null>(null)
  const [confirmPostId, setConfirmPostId] = useState<string | null>(null)
  const profileId = profile?.id

  // Refetch tiap tab profil dibuka — semua tab selalu mounted (AnimatedTab),
  // jadi tanpa ini stats/list jadi basi setelah aktivitas di tab lain
  useEffect(() => {
    if (!profileId || !active) return
    getMyActivePosts(profileId).then(setMyPosts).catch(() => setMyPosts([]))
    getMessageStats(profileId).then(setMsgStats).catch(() => setMsgStats({ sent: 0, received: 0 }))
  }, [profileId, active])

  if (!profile) return null

  // Fix: compute hue from username
  const hue = hashStr(profile.username) % 360

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

  const handleDeleteAccount = async () => {
    setDeleteError('')
    if (!deletePassword) { setDeleteError('Password is required'); return }
    setDeletingLoading(true)
    try {
      await deleteAccount(deletePassword)
      // deleteAccount handles sign-out internally; app will redirect automatically
    } catch (e: any) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setDeleteError('Incorrect password')
      } else if (e.code === 'auth/too-many-requests') {
        setDeleteError('Too many attempts. Try again later.')
      } else {
        setDeleteError('Failed to delete account. Try again.')
      }
    } finally {
      setDeletingLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    setConfirmPostId(null)
    setMyPosts(prev => prev?.filter(p => p.id !== postId) ?? prev)
    try {
      await deletePost(postId)
    } catch {
      // Re-sync kalau gagal
      getMyActivePosts(profile.id).then(setMyPosts).catch(() => {})
    }
  }

  const avatarSrc = pendingPhoto || (profile as any).photo_url || getAvatarUrl(profile.username)

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
    if (saving) return
    setSaving(true)
    setError('')
    const newPhotoBase64 = photoPreview
    // Optimistic: sheet langsung ditutup dan avatar memakai preview lokal —
    // upload Storage + simpan profil berjalan di belakang, bukan menahan UI.
    // Profil di context ter-update otomatis lewat listener onSnapshot AuthProvider.
    setEditing(false)
    if (newPhotoBase64) setPendingPhoto(newPhotoBase64)
    try {
      let finalPhotoUrl = photoUrl.trim() || null
      if (newPhotoBase64) {
        finalPhotoUrl = await uploadProfilePhoto(profile.id, newPhotoBase64)
      }
      await updateProfile(profile.id, {
        photo_url: finalPhotoUrl,
        bio: bio.trim() || null,
        twitter: twitter.trim() || null,
        telegram: telegram.trim() || null,
        tip_ca: tipCA.trim() || null,
      })
      if (newPhotoBase64 && finalPhotoUrl) {
        // Tahan preview sampai foto dari URL baru selesai diunduh — tanpa
        // ini avatar sempat kosong/menampilkan foto lama saat URL loading
        const img = new Image()
        img.onload = () => setPendingPhoto(null)
        img.onerror = () => setPendingPhoto(null)
        img.src = finalPhotoUrl
      } else {
        setPendingPhoto(null)
      }
    } catch {
      // Gagal: buka lagi sheet dengan nilai yang tadi diisi + pesan error
      setPendingPhoto(null)
      setError('Failed to save. Try again.')
      setEditing(true)
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
            className={`profile-avatar-img${saving ? ' profile-avatar-img--uploading' : ''}`}
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile.username}</span>
          {profile.is_verified && <BadgeChip type="official"/>}
          {profile.badge_type && <BadgeChip type={profile.badge_type}/>}
        </div>

        {/* Bio */}
        {(profile as any).bio && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
            {(profile as any).bio}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 28, justifyContent: 'center', margin: '6px 0 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{msgStats?.sent ?? '–'}</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Messages Sent</span>
          </div>
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }}/>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{msgStats?.received ?? '–'}</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Messages Received</span>
          </div>
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
              Tip / Contract Address
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


        {/* My Active Posts */}
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            My Active Posts
          </div>
          {myPosts === null && (
            <div style={{ padding: '14px 0', textAlign: 'center' }}><span className="spinner"/></div>
          )}
          {myPosts?.length === 0 && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '6px 0' }}>
              No active posts. Posts disappear after 24 hours.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myPosts?.map(p => (
              <div key={p.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word',
                  }}>
                    {p.body}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>{expiresIn(p.expires_at) ?? 'expired'}</span>
                    <span>{p.comment_count} comments</span>
                  </div>
                </div>
                <button
                  onClick={() => confirmPostId === p.id ? handleDeletePost(p.id) : setConfirmPostId(p.id)}
                  onBlur={() => setConfirmPostId(null)}
                  title={confirmPostId === p.id ? 'Tap again to delete' : 'Delete post'}
                  style={{
                    background: confirmPostId === p.id ? 'var(--red)' : 'none',
                    border: 'none', borderRadius: 'var(--radius-xs)', padding: 7,
                    color: confirmPostId === p.id ? '#fff' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', flexShrink: 0,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          className="signout-btn"
          onClick={() => { setChangingPw(true); setPwError(''); setPwSuccess(false) }}
          style={{ color: 'var(--accent)', marginBottom: 0, WebkitTapHighlightColor: 'transparent' }}
        >
          Change Password
        </button>
        {/* Delete Account button */}
        <button
          className="signout-btn"
          onClick={() => { setDeletingAccount(true); setDeletePassword(''); setDeleteError('') }}
          style={{ color: 'var(--red)', marginTop: 8, WebkitTapHighlightColor: 'transparent' }}
        >
          Delete Account
        </button>
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

      {/* ── Delete Account Sheet ── */}
      {deletingAccount && (
        <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) { setDeletingAccount(false) } }}>
          <div className="sheet" style={{ gap: 12 }}>
            <div className="sheet__handle"/>
            <div className="sheet__title" style={{ color: 'var(--red)' }}>Delete Account</div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              This will permanently delete your account and all your data. This action <strong>cannot be undone</strong>.
            </p>

            <label style={labelStyle}>Confirm your password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={deletePassword}
              onChange={e => { setDeletePassword(e.target.value); setDeleteError('') }}
              autoFocus
            />

            {deleteError && <p style={{ color: 'var(--red)', fontSize: '0.8rem' }}>{deleteError}</p>}

            <button
              className="auth-btn"
              onClick={handleDeleteAccount}
              disabled={deletingLoading}
              style={{ background: 'var(--red)' }}
            >
              {deletingLoading ? <span className="spinner spinner--sm"/> : 'Delete My Account'}
            </button>

            <button
              className="signout-btn"
              onClick={() => setDeletingAccount(false)}
              style={{ marginTop: -4 }}
            >
              Cancel
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
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', background: 'var(--accent-soft)', border: '2px solid var(--border)' }}
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
