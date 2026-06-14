import { describe, expect, it } from 'vitest'
import { parseBlocks } from './format'

describe('parseBlocks', () => {
  it('returns a single paragraph for plain text', () => {
    expect(parseBlocks('Halo dunia')).toEqual([{ type: 'p', text: 'Halo dunia' }])
  })

  it('splits paragraphs on blank lines', () => {
    expect(parseBlocks('Baris satu\n\nBaris dua')).toEqual([
      { type: 'p', text: 'Baris satu' },
      { type: 'p', text: 'Baris dua' },
    ])
  })

  it('keeps internal line breaks within a paragraph', () => {
    expect(parseBlocks('Baris satu\nBaris dua')).toEqual([
      { type: 'p', text: 'Baris satu\nBaris dua' },
    ])
  })

  it('groups hyphen lines into a bullet list', () => {
    expect(parseBlocks('- apel\n- jeruk')).toEqual([
      { type: 'ul', items: ['apel', 'jeruk'] },
    ])
  })

  it('groups numbered lines into an ordered list', () => {
    expect(parseBlocks('1. satu\n2) dua')).toEqual([
      { type: 'ol', items: ['satu', 'dua'] },
    ])
  })

  it('separates a paragraph followed by a list', () => {
    expect(parseBlocks('Daftar belanja:\n- apel\n- jeruk')).toEqual([
      { type: 'p', text: 'Daftar belanja:' },
      { type: 'ul', items: ['apel', 'jeruk'] },
    ])
  })

  it('starts a new list when the list type changes', () => {
    expect(parseBlocks('- a\n1. b')).toEqual([
      { type: 'ul', items: ['a'] },
      { type: 'ol', items: ['b'] },
    ])
  })

  it('returns an empty array for empty input', () => {
    expect(parseBlocks('')).toEqual([])
    expect(parseBlocks('   \n  ')).toEqual([])
  })
})
