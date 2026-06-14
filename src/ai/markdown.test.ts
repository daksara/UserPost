import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown } from './markdown'

describe('parseInline', () => {
  it('keeps plain text as one token', () => {
    expect(parseInline('halo dunia')).toEqual([{ type: 'text', value: 'halo dunia' }])
  })

  it('parses bold, italic, and inline code', () => {
    expect(parseInline('a **b** c')).toEqual([
      { type: 'text', value: 'a ' },
      { type: 'strong', value: 'b' },
      { type: 'text', value: ' c' },
    ])
    expect(parseInline('pakai `npm run dev` ya')).toEqual([
      { type: 'text', value: 'pakai ' },
      { type: 'code', value: 'npm run dev' },
      { type: 'text', value: ' ya' },
    ])
    expect(parseInline('ini *miring*')).toEqual([
      { type: 'text', value: 'ini ' },
      { type: 'em', value: 'miring' },
    ])
  })

  it('parses links', () => {
    expect(parseInline('lihat [situs](https://contoh.com) ya')).toEqual([
      { type: 'text', value: 'lihat ' },
      { type: 'link', value: 'situs', href: 'https://contoh.com' },
      { type: 'text', value: ' ya' },
    ])
  })

  it('does not treat snake_case as italic', () => {
    expect(parseInline('nama_variabel_panjang')).toEqual([
      { type: 'text', value: 'nama_variabel_panjang' },
    ])
  })

  it('prefers bold over italic on double asterisks', () => {
    expect(parseInline('**tebal**')).toEqual([{ type: 'strong', value: 'tebal' }])
  })
})

describe('parseMarkdown', () => {
  it('parses a paragraph', () => {
    expect(parseMarkdown('Halo dunia')).toEqual([{ type: 'p', text: 'Halo dunia' }])
  })

  it('parses headings', () => {
    expect(parseMarkdown('## Judul')).toEqual([{ type: 'heading', level: 2, text: 'Judul' }])
  })

  it('parses a fenced code block with language', () => {
    expect(parseMarkdown('```js\nconst a = 1\n```')).toEqual([
      { type: 'code', lang: 'js', code: 'const a = 1' },
    ])
  })

  it('keeps indentation inside code blocks', () => {
    expect(parseMarkdown('```\n  indented\n    more\n```')).toEqual([
      { type: 'code', lang: '', code: '  indented\n    more' },
    ])
  })

  it('parses bullet and numbered lists', () => {
    expect(parseMarkdown('- apel\n- jeruk')).toEqual([
      { type: 'ul', items: ['apel', 'jeruk'] },
    ])
    expect(parseMarkdown('2. satu\n3. dua')).toEqual([
      { type: 'ol', items: ['satu', 'dua'], start: 2 },
    ])
  })

  it('parses a blockquote and horizontal rule', () => {
    expect(parseMarkdown('> dikutip')).toEqual([{ type: 'quote', text: 'dikutip' }])
    expect(parseMarkdown('---')).toEqual([{ type: 'hr' }])
  })

  it('parses a GFM table with alignment', () => {
    const md = '| a | b |\n| :--- | ---: |\n| 1 | 2 |'
    expect(parseMarkdown(md)).toEqual([
      {
        type: 'table',
        header: ['a', 'b'],
        align: ['left', 'right'],
        rows: [['1', '2']],
      },
    ])
  })

  it('separates blocks by blank lines', () => {
    expect(parseMarkdown('Satu\n\n## Dua')).toEqual([
      { type: 'p', text: 'Satu' },
      { type: 'heading', level: 2, text: 'Dua' },
    ])
  })
})
