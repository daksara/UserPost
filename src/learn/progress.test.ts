import { describe, expect, it } from 'vitest'
import { LESSONS, LEVELS, TOTAL_LESSONS, lessonsByLevel } from './curriculum'
import { levelProgress, overallPercent, sanitizeCompleted } from './progress'

describe('sanitizeCompleted', () => {
  it('keeps only valid, unique lesson ids in order', () => {
    const a = LESSONS[0].id
    const b = LESSONS[1].id
    expect(sanitizeCompleted([a, 'nope', a, b, 42, null])).toEqual([a, b])
  })

  it('returns empty for non-array input', () => {
    expect(sanitizeCompleted(null)).toEqual([])
    expect(sanitizeCompleted('x')).toEqual([])
  })
})

describe('levelProgress', () => {
  it('reports one entry per level with correct totals', () => {
    const out = levelProgress([])
    expect(out).toHaveLength(LEVELS.length)
    for (const p of out) {
      expect(p.total).toBe(lessonsByLevel(p.level).length)
      expect(p.done).toBe(0)
    }
  })

  it('counts a completed lesson within its level', () => {
    const lvl = LEVELS[0].id
    const first = lessonsByLevel(lvl)[0]
    const entry = levelProgress([first.id]).find((p) => p.level === lvl)!
    expect(entry.done).toBe(1)
  })
})

describe('overallPercent', () => {
  it('is 0 with nothing completed', () => {
    expect(overallPercent([])).toBe(0)
  })

  it('is 100 when all lessons completed', () => {
    expect(overallPercent(LESSONS.map((l) => l.id))).toBe(100)
  })

  it('rounds the fraction', () => {
    expect(overallPercent([LESSONS[0].id])).toBe(Math.round((1 / TOTAL_LESSONS) * 100))
  })
})
