import { describe, expect, it } from 'vitest'
import { cleanText } from './clean'

describe('cleanText', () => {
  it('preserves markdown markers (renderer handles them)', () => {
    expect(cleanText('Halo **dunia** dan *kamu*')).toBe('Halo **dunia** dan *kamu*')
    expect(cleanText('## Judul')).toBe('## Judul')
    expect(cleanText('pakai `npm run dev` ya')).toBe('pakai `npm run dev` ya')
  })

  it('keeps emoji intact', () => {
    expect(cleanText('Mantap 🚀 kerja bagus ✅')).toBe('Mantap 🚀 kerja bagus ✅')
  })

  it('keeps code-block indentation intact', () => {
    expect(cleanText('```\n  indented\n    more\n```')).toBe('```\n  indented\n    more\n```')
  })

  it('keeps a plain dash list intact', () => {
    expect(cleanText('- satu\n- dua')).toBe('- satu\n- dua')
  })

  it('normalizes special hyphens to a plain dash', () => {
    // e‑book pakai non-breaking hyphen; real‐time pakai hyphen
    expect(cleanText('e‑book real‐time')).toBe('e-book real-time')
  })

  it('normalizes non-breaking and thin spaces to a normal space', () => {
    expect(cleanText('harga Rp 100 ribu')).toBe('harga Rp 100 ribu')
  })

  it('strips trailing whitespace on lines but keeps leading indent', () => {
    expect(cleanText('Judul   \n   teks')).toBe('Judul\n   teks')
  })

  it('collapses 3+ blank lines and trims edges', () => {
    expect(cleanText('  a\n\n\n\nb  ')).toBe('a\n\nb')
  })
})
