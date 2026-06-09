import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { auth, type Profile } from '../lib/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

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
    photo_url: d.photo_url ?? null,
    bio: d.bio ?? null,
    twitter: d.twitter ?? null,
    telegram: d.telegram ?? null,
    tip_ca: d.tip_ca ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // refreshProfile: force re-read dari Firestore (dipanggil setelah updateProfile)
  const refreshProfile = useCallback(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'profiles', user.uid), (snap) => {
      if (snap.exists()) setProfile(snapToProfile(snap))
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
          if (snap.exists()) setProfile(snapToProfile(snap))
          setLoading(false)
        })
      } else {
        setProfile(null)
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

export const useAuth = () => useContext(AuthContext)
