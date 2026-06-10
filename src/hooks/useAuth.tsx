import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { auth, type Profile } from '../lib/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

const PROFILE_CACHE_KEY = 'profile-cache'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => void
}

const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true, refreshProfile: () => {} })

function snapToProfile(snap: any): Profile {
  const d = snap.data()
  return {
    id: snap.id,
    username: d.username,
    created_at: d.created_at?.toDate().toISOString() ?? new Date().toISOString(),
    is_verified: d.is_verified ?? false,
    badge_type: d.badge_type ?? null,
    photo_url: d.photo_url ?? null,
    bio: d.bio ?? null,
    twitter: d.twitter ?? null,
    telegram: d.telegram ?? null,
    tip_ca: d.tip_ca ?? null,
  }
}

function readCachedProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function cacheProfile(p: Profile) {
  try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p)) } catch { /* ignore storage errors */ }
}

function clearProfileCache() {
  try { localStorage.removeItem(PROFILE_CACHE_KEY) } catch { /* ignore storage errors */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(readCachedProfile)
  // Skip the loading spinner if we already have a cached profile
  const [loading, setLoading] = useState<boolean>(() => readCachedProfile() === null)

  const refreshProfile = useCallback(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'profiles', user.uid), (snap) => {
      if (snap.exists()) {
        const p = snapToProfile(snap)
        setProfile(p)
        cacheProfile(p)
      }
      unsub()
    })
  }, [user])

  useEffect(() => {
    let unsubProfile: (() => void) | null = null

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      setUser(firebaseUser)

      if (unsubProfile) { unsubProfile(); unsubProfile = null }

      if (firebaseUser) {
        unsubProfile = onSnapshot(doc(db, 'profiles', firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            const p = snapToProfile(snap)
            setProfile(p)
            cacheProfile(p)
          }
          setLoading(false)
        })
      } else {
        setProfile(null)
        clearProfileCache()
        setLoading(false)
      }
    })

    return () => {
      unsubAuth()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
