// src/learn/progress.ts
// Helper murni untuk progres belajar VA. Dipisah dari React agar mudah diuji
// dan dipakai ulang oleh hook penyimpanan (useLearning).
import { LEVELS, LESSONS, TOTAL_LESSONS, lessonsByLevel } from './curriculum'
import type { LevelId } from './curriculum'

/**
 * Validasi daftar id materi selesai dari localStorage: hanya pertahankan id
 * yang masih ada di kurikulum dan buang duplikat. Mencegah state lama/korup
 * menghitung progres secara keliru.
 */
export function sanitizeCompleted(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const valid = new Set(LESSONS.map((l) => l.id))
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of raw) {
    if (typeof id !== 'string' || !valid.has(id) || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export interface LevelProgress {
  level: LevelId
  done: number
  total: number
}

/** Jumlah materi selesai per level, hanya menghitung id yang valid. */
export function levelProgress(completed: Iterable<string>): LevelProgress[] {
  const set = completed instanceof Set ? completed : new Set(completed)
  return LEVELS.map((lvl) => {
    const lessons = lessonsByLevel(lvl.id)
    const done = lessons.reduce((n, l) => n + (set.has(l.id) ? 1 : 0), 0)
    return { level: lvl.id, done, total: lessons.length }
  })
}

/** Persentase keseluruhan (0-100, dibulatkan) materi yang sudah selesai. */
export function overallPercent(completed: Iterable<string>): number {
  const set = completed instanceof Set ? completed : new Set(completed)
  const done = LESSONS.reduce((n, l) => n + (set.has(l.id) ? 1 : 0), 0)
  if (TOTAL_LESSONS === 0) return 0
  return Math.round((done / TOTAL_LESSONS) * 100)
}
