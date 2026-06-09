import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { auth, getProfile, type Profile } from '../lib/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubProfile: (() => void) | null = null

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      setUser(firebaseUser)

      // Bersihkan listener profile sebelumnya
      if (unsubProfile) { unsubProfile(); unsubProfile = null }

      if (firebaseUser) {
        // Realtime listener ke dokumen profile — update otomatis kalau is_verified berubah
        unsubProfile = onSnapshot(doc(db, 'profiles', firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            const d = snap.data()
            setProfile({
              id: snap.id,
              username: d.username,
              created_at: d.created_at?.toDate().toISOString() ?? new Date().toISOString(),
              is_verified: d.is_verified ?? false,
            })
          }
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
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
