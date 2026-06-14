// src/hooks/useLearning.ts
// Progres belajar VA yang tersimpan di localStorage: kumpulan id materi yang
// sudah ditandai selesai. Logika perhitungan ada di learn/progress.ts agar
// murni dan mudah diuji; hook ini hanya mengurus penyimpanan dan aksi.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { sanitizeCompleted } from '../learn/progress'

const STORAGE_KEY = 'pendar-learning'

function load(): string[] {
  try {
    return sanitizeCompleted(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return []
  }
}

export function useLearning() {
  const [completed, setCompleted] = useState<string[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed))
    } catch {
      /* kuota penuh — abaikan dengan aman */
    }
  }, [completed])

  const completedSet = useMemo(() => new Set(completed), [completed])

  const isDone = useCallback((id: string) => completedSet.has(id), [completedSet])

  const toggleDone = useCallback((id: string) => {
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const markDone = useCallback((id: string) => {
    setCompleted((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const reset = useCallback(() => setCompleted([]), [])

  return { completed, completedSet, isDone, toggleDone, markDone, reset }
}
