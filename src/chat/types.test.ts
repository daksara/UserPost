import { describe, expect, it } from 'vitest'
import { deriveTitle, isEmpty, makeConversation, sanitizeConversations } from './types'

describe('deriveTitle', () => {
  it('uses the first non-empty line, trimmed', () => {
    expect(deriveTitle('  \n\nBuatkan proposal\nuntuk klien')).toBe('Buatkan proposal')
  })

  it('strips wrapping quotes and collapses whitespace', () => {
    expect(deriveTitle('"Halo    dunia"')).toBe('Halo dunia')
  })

  it('truncates long titles with an ellipsis', () => {
    const long = 'a'.repeat(80)
    const out = deriveTitle(long)
    expect(out.endsWith('…')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(48)
  })

  it('falls back when text is empty', () => {
    expect(deriveTitle('   \n  ')).toBe('Percakapan baru')
  })
})

describe('makeConversation / isEmpty', () => {
  it('creates an empty, titled conversation', () => {
    const c = makeConversation('proposal')
    expect(c.templateId).toBe('proposal')
    expect(isEmpty(c)).toBe(true)
    expect(c.id).toBeTruthy()
  })
})

describe('sanitizeConversations', () => {
  it('drops corrupt entries and invalid turns', () => {
    const out = sanitizeConversations([
      { id: 'a', title: 'Ok', turns: [{ id: 't1', role: 'user', content: 'hi' }], updatedAt: 2 },
      { id: 'b', turns: 'not-array' },
      { nope: true },
      { id: 'c', turns: [{ id: 't2', role: 'system', content: 'x' }], updatedAt: 1 },
    ])
    expect(out.map((c) => c.id)).toEqual(['a', 'c'])
    expect(out[0].turns).toHaveLength(1)
    expect(out[1].turns).toHaveLength(0) // invalid role filtered out
  })

  it('returns empty array for non-array input', () => {
    expect(sanitizeConversations(null)).toEqual([])
    expect(sanitizeConversations({})).toEqual([])
  })

  it('sorts by most recently updated', () => {
    const out = sanitizeConversations([
      { id: 'old', turns: [], updatedAt: 1 },
      { id: 'new', turns: [], updatedAt: 9 },
    ])
    expect(out.map((c) => c.id)).toEqual(['new', 'old'])
  })
})
