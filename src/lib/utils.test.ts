import { describe, it, expect } from 'vitest'
import { timeAgo, expiresIn, convoId, chunk, isEmail } from './utils'

const NOW = new Date('2026-01-01T12:00:00Z').getTime()
const iso = (msFromNow: number) => new Date(NOW + msFromNow).toISOString()

describe('timeAgo', () => {
  it('formats seconds, minutes, hours, days', () => {
    expect(timeAgo(iso(-30_000), NOW)).toBe('30s')
    expect(timeAgo(iso(-5 * 60_000), NOW)).toBe('5m')
    expect(timeAgo(iso(-3 * 3_600_000), NOW)).toBe('3h')
    expect(timeAgo(iso(-2 * 86_400_000), NOW)).toBe('2d')
  })

  it('never goes negative for future timestamps', () => {
    expect(timeAgo(iso(60_000), NOW)).toBe('0s')
  })
})

describe('expiresIn', () => {
  it('returns hours when more than an hour remains', () => {
    expect(expiresIn(iso(5 * 3_600_000 + 30 * 60_000), NOW)).toBe('5h left')
  })

  it('returns minutes when under an hour remains', () => {
    expect(expiresIn(iso(45 * 60_000), NOW)).toBe('45m left')
  })

  it('returns null when expired', () => {
    expect(expiresIn(iso(-1), NOW)).toBeNull()
  })
})

describe('convoId', () => {
  it('is order-independent', () => {
    expect(convoId('alice', 'bob')).toBe('alice_bob')
    expect(convoId('bob', 'alice')).toBe('alice_bob')
  })
})

describe('chunk', () => {
  it('splits arrays into fixed-size chunks', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([], 3)).toEqual([])
  })
})

describe('isEmail', () => {
  it('detects emails vs usernames', () => {
    expect(isEmail('user@example.com')).toBe(true)
    expect(isEmail('some_username')).toBe(false)
    expect(isEmail('a@b')).toBe(false)
  })
})
