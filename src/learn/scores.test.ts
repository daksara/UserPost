import { describe, expect, it } from 'vitest'
import { bestScore, isMastered, recordBest, sanitizeScores } from './scores'

describe('scores', () => {
  it('sanitizes valid entries and drops bad ones', () => {
    const out = sanitizeScores({
      'level:pemula': { correct: 2, total: 3 },
      bad1: { correct: 5, total: 3 },
      bad2: { correct: 'x', total: 3 },
      bad3: null,
      bad4: { correct: 1, total: 0 },
    })
    expect(out).toEqual({ 'level:pemula': { correct: 2, total: 3 } })
  })

  it('treats non-object input as empty', () => {
    expect(sanitizeScores(null)).toEqual({})
    expect(sanitizeScores('nope')).toEqual({})
    expect(sanitizeScores(42)).toEqual({})
  })

  it('bestScore keeps the higher ratio', () => {
    expect(bestScore(undefined, 1, 3)).toEqual({ correct: 1, total: 3 })
    expect(bestScore({ correct: 1, total: 3 }, 2, 3)).toEqual({ correct: 2, total: 3 })
    expect(bestScore({ correct: 3, total: 3 }, 1, 3)).toEqual({ correct: 3, total: 3 })
  })

  it('recordBest updates only the given key and does not mutate input', () => {
    const s = { a: { correct: 1, total: 2 } }
    const out = recordBest(s, 'b', 1, 1)
    expect(out).toEqual({ a: { correct: 1, total: 2 }, b: { correct: 1, total: 1 } })
    expect(s).toEqual({ a: { correct: 1, total: 2 } })
  })

  it('isMastered only when perfect', () => {
    expect(isMastered({ correct: 3, total: 3 })).toBe(true)
    expect(isMastered({ correct: 2, total: 3 })).toBe(false)
    expect(isMastered(undefined)).toBe(false)
  })
})
