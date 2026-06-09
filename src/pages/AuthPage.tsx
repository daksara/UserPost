import { useState } from 'react'
import { signIn, signUp, checkUsernameAvailable } from '../lib/firebase'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!username.trim() || !password.trim()) return setError('Fill in all fields.')
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
      return setError('Username: 3–20 chars, letters/numbers/underscore only.')
    if (password.length < 6) return setError('Password min 6 characters.')

    setLoading(true)
    try {
      if (mode === 'register') {
        const available = await checkUsernameAvailable(username)
        if (!available) { setError('Username already taken.'); setLoading(false); return }
        await signUp(username, password)
      } else {
        await signIn(username, password)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo__dot"/>
          <span className="auth-logo__name">UserPost</span>
        </div>
        <p className="auth-tagline">Posts disappear in 24 hours.</p>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`} onClick={() => { setMode('login'); setError('') }}>Sign in</button>
          <button className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`} onClick={() => { setMode('register'); setError('') }}>Create account</button>
        </div>

        <div className="auth-fields">
          <input
            className="auth-input"
            placeholder="Username"
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            autoComplete="username"
            autoCapitalize="none"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner"/> : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </div>
    </div>
  )
}
