import { useEffect, useRef } from 'react'
import { db } from '../lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

const TABLE_MAP: Record<string, string> = {
  posts: 'posts',
  comments: 'posts',
  messages: 'conversations',
}

export function useRealtime(table: string, callback: () => void) {
  const callbackRef = useRef(callback)
  useEffect(() => { callbackRef.current = callback })

  useEffect(() => {
    const collectionPath = TABLE_MAP[table] ?? table
    const unsubscribe = onSnapshot(
      collection(db, collectionPath),
      () => { callbackRef.current() }
    )
    return () => unsubscribe()
  }, [table])
}
