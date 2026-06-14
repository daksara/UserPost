// src/learn/scores.ts
// Helper murni untuk skor kuis (Latihan Klien & Uji pemahaman). Dipisah dari
// React agar mudah diuji dan dipakai ulang oleh hook penyimpanan (useQuizScores).
// Skor disimpan per kunci kuis; hanya skor terbaik (rasio tertinggi) dipertahankan.

export interface QuizScore {
  correct: number
  total: number
}

export type QuizScores = Record<string, QuizScore>

/** Validasi peta skor dari localStorage: buang entri rusak/di luar rentang. */
export function sanitizeScores(raw: unknown): QuizScores {
  const out: QuizScores = {}
  if (typeof raw !== 'object' || raw === null) return out
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v !== 'object' || v === null) continue
    const rec = v as Record<string, unknown>
    const c = rec.correct
    const t = rec.total
    if (
      typeof c === 'number' &&
      typeof t === 'number' &&
      Number.isFinite(c) &&
      Number.isFinite(t) &&
      t > 0 &&
      c >= 0 &&
      c <= t
    ) {
      out[k] = { correct: Math.floor(c), total: Math.floor(t) }
    }
  }
  return out
}

/** Skor terbaik antara yang lama dan yang baru (rasio tertinggi; seri: total lebih besar). */
export function bestScore(prev: QuizScore | undefined, correct: number, total: number): QuizScore {
  const next: QuizScore = { correct, total }
  if (!prev) return next
  const a = prev.total > 0 ? prev.correct / prev.total : 0
  const b = total > 0 ? correct / total : 0
  if (b > a || (b === a && total > prev.total)) return next
  return prev
}

/** Kembalikan peta baru dengan skor terbaik untuk satu kunci. Tidak memutasi input. */
export function recordBest(scores: QuizScores, key: string, correct: number, total: number): QuizScores {
  return { ...scores, [key]: bestScore(scores[key], correct, total) }
}

/** True bila skor sempurna (semua benar). Dipakai untuk badge "Lulus". */
export function isMastered(score: QuizScore | undefined): boolean {
  return !!score && score.total > 0 && score.correct === score.total
}
