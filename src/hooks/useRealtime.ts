// src/hooks/useRealtime.ts
// Drop-in replacement for the Supabase useRealtime hook.
// Uses Firestore onSnapshot to listen for changes.

import { useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

// Maps Supabase table names → Firestore collection paths
const TABLE_MAP: Record<string, string> = {
  posts: 'posts',
  comments: 'posts',   // subcollection — top-level listener on 'posts' is enough
  messages: 'conversations',
}

export function useRealtime(table: string, callback: () => void) {
  useEffect(() => {
    const collectionPath = TABLE_MAP[table] ?? table
    const unsubscribe = onSnapshot(collection(db, collectionPath), () => {
      callback()
    })
    return () => unsubscribe()
  }, [table, callback])
}
