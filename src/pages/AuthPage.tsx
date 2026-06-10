import { useState, useEffect } from 'react'
import { signIn, signUp, forgotPassword, checkUsernameAvailable } from '../lib/firebase'
import { isEmail } from '../lib/utils'

function EyeIcon({ open }: { open: boolean }) {
  return open
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null
  const len = password.length
  const level = len < 6 ? 1 : len < 8 ? 2 : len < 12 ? 3 : 4
  const labels = ['', 'Too short', 'Weak', 'Good', 'Strong']
  const colors = ['', 'var(--red)', '#f97316', '#eab308', '#22c55e']
  return (
    <div style={{ marginTop: -4 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= level ? colors[level] : 'var(--border)',
            transition: 'background 0.2s',
          }}/>
        ))}
      </div>
      <span style={{ fontSize: '0.7rem', color: colors[level] }}>{labels[level]}</span>
    </div>
  )
}

function PasswordInput({ value, onChange, placeholder, autoComplete, onEnter, showPassword, onToggle }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete: string
  onEnter: () => void
  showPassword: boolean
  onToggle: () => void
}) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="auth-input"
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        onKeyDown={e => e.key === 'Enter' && onEnter()}
        style={{ paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 4, display: 'flex',
        }}
      >
        <EyeIcon open={showPassword}/>
      </button>
    </div>
  )
}

function mapFirebaseError(e: unknown): string {
  const code: string = (e as any)?.code ?? ''
  const msg: string = e instanceof Error ? e.message : ''
  if (msg.includes('already taken')) return 'Username already taken.'
  if (code === 'auth/email-already-in-use') return 'Email already in use.'
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Incorrect username or password.'
  if (code === 'auth/user-not-found') return 'Incorrect username or password.'
  if (code === 'auth/too-many-requests') return 'Too many attempts. Try again later.'
  if (code === 'auth/weak-password') return 'Password is too weak (min 6 characters).'
  if (code === 'auth/invalid-email') return 'Invalid email address.'
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection.'
  return msg || 'Something went wrong. Try again.'
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Live username availability check
  const [unameStatus, setUnameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  useEffect(() => {
    if (mode !== 'register') { setUnameStatus('idle'); return }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { setUnameStatus('idle'); return }
    setUnameStatus('checking')
    const t = setTimeout(async () => {
      const ok = await checkUsernameAvailable(username)
      setUnameStatus(ok ? 'available' : 'taken')
    }, 500)
    return () => clearTimeout(t)
  }, [username, mode])

  const clearForm = () => {
    setError(''); setSuccess('')
    setPassword(''); setConfirmPassword('')
    setShowPassword(false)
  }

  const switchMode = (m: typeof mode) => { clearForm(); setMode(m) }

  const handleSubmit = async () => {
    setError(''); setSuccess('')

    if (mode === 'forgot') {
      if (!username.trim()) return setError('Enter your email or username.')
      setLoading(true)
      try {
        await forgotPassword(username.trim())
        setSuccess('Reset link sent! Check your recovery email.')
      } catch (e) {
        setError(mapFirebaseError(e))
      } finally { setLoading(false) }
      return
    }

    if (!username.trim() || !password.trim()) return setError('Fill in all fields.')
    // Login accepts an email address; usernames must match the strict pattern
    if (!(mode === 'login' && isEmail(username.trim())) && !/^[a-zA-Z0-9_]{3,20}$/.test(username))
      return setError('Username: 3–20 chars, letters/numbers/underscore only.')
    if (password.length < 6) return setError('Password min 6 characters.')

    if (mode === 'register') {
      if (!email.trim()) return setError('Email required for password recovery.')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address.')
      if (password !== confirmPassword) return setError('Passwords do not match.')
      if (unameStatus === 'taken') return setError('Username already taken.')
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        await signUp(username.trim(), email.trim().toLowerCase(), password)
      } else {
        await signIn(username.trim(), password)
      }
    } catch (e) {
      setError(mapFirebaseError(e))
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo__dot"/>
          <span className="auth-logo__name">UserPost</span>
        </div>
        <p className="auth-tagline">Posts disappear in 24 hours.</p>

        {mode !== 'forgot' && (
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`} onClick={() => switchMode('login')}>Sign in</button>
            <button className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`} onClick={() => switchMode('register')}>Create account</button>
          </div>
        )}

        {mode === 'forgot' && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 8 }}>
            Enter your email (or legacy username) to receive a password reset link.
          </p>
        )}

        <div className="auth-fields">
          {/* Username */}
          <div style={{ position: 'relative' }}>
            <input
              className="auth-input"
              placeholder={mode === 'register' ? 'Username' : 'Email or username'}
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              autoComplete="username"
              autoCapitalize="none"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            {mode === 'register' && unameStatus !== 'idle' && (
              <span style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: '0.8rem', fontWeight: 700,
                color: unameStatus === 'available' ? '#22c55e' : unameStatus === 'taken' ? 'var(--red)' : 'var(--text-muted)',
              }}>
                {unameStatus === 'checking' ? '…' : unameStatus === 'available' ? '✓' : '✗ Taken'}
              </span>
            )}
          </div>

          {/* Email — register only */}
          {mode === 'register' && (
            <input
              className="auth-input"
              type="email"
              placeholder="Email (for password recovery)"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              autoComplete="email"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          )}

          {/* Password */}
          {mode !== 'forgot' && (
            <>
              <PasswordInput
                value={password}
                onChange={v => { setPassword(v); setError('') }}
                placeholder="Password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onEnter={handleSubmit}
                showPassword={showPassword}
                onToggle={() => setShowPassword(v => !v)}
              />
              {mode === 'register' && <PasswordStrengthBar password={password}/>}
            </>
          )}

          {/* Confirm password — register only */}
          {mode === 'register' && (
            <PasswordInput
              value={confirmPassword}
              onChange={v => { setConfirmPassword(v); setError('') }}
              placeholder="Confirm password"
              autoComplete="new-password"
              onEnter={handleSubmit}
              showPassword={showPassword}
              onToggle={() => setShowPassword(v => !v)}
            />
          )}
        </div>

        {error && <p className="auth-error">{error}</p>}
        {success && <p style={{ color: '#22c55e', fontSize: '0.85rem', textAlign: 'center', marginTop: 4 }}>{success}</p>}

        <button
          className="auth-btn"
          onClick={handleSubmit}
          disabled={loading || (mode === 'register' && unameStatus === 'taken')}
        >
          {loading
            ? <span className="spinner"/>
            : mode === 'login' ? 'Sign in'
            : mode === 'register' ? 'Create account'
            : 'Send reset link'}
        </button>

        {mode === 'login' && (
          <button
            onClick={() => switchMode('forgot')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', marginTop: 2, padding: '4px 0' }}
          >
            Forgot password?
          </button>
        )}

        {mode === 'forgot' && (
          <button
            onClick={() => switchMode('login')}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', marginTop: 4, padding: '4px 0' }}
          >
            ← Back to sign in
          </button>
        )}
      </div>
    </div>
  )
}
