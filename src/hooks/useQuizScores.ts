// src/hooks/useQuizScores.ts
// Skor kuis yang tersimpan di localStorage: peta {kunciKuis: {correct, total}}
// menyimpan skor terbaik. Logika murni ada di learn/scores.ts agar mudah diuji;
// hook ini hanya mengurus penyimpanan dan aksi.
import { useCallback, useEffect, useState } from 'react'
import { recordBest, sanitizeScores } from '../learn/scores'
import type { QuizScores } from '../learn/scores'

const STORAGE_KEY = 'pendar-quiz-scores'

function load(): QuizScores {
  try {
    return sanitizeScores(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))
  } catch {
    return {}
  }
}

export function useQuizScores() {
  const [scores, setScores] = useState<QuizScores>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
    } catch {
      /* kuota penuh - abaikan dengan aman */
    }
  }, [scores])

  const recordScore = useCallback((key: string, correct: number, total: number) => {
    setScores((prev) => recordBest(prev, key, correct, total))
  }, [])

  const reset = useCallback(() => setScores({}), [])

  return { scores, recordScore, reset }
}
