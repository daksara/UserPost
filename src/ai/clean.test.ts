import { describe, expect, it } from 'vitest'
import { cleanText } from './clean'

describe('cleanText', () => {
  it('removes bold and italic markers', () => {
    expect(cleanText('Halo **dunia** dan *kamu*')).toBe('Halo dunia dan kamu')
    expect(cleanText('__tebal__ juga')).toBe('tebal juga')
  })

  it('strips heading hashes and code backticks', () => {
    expect(cleanText('## Judul')).toBe('Judul')
    expect(cleanText('pakai `npm run dev` ya')).toBe('pakai npm run dev ya')
  })

  it('normalizes bullets to a dash', () => {
    expect(cleanText('* satu\n• dua')).toBe('- satu\n- dua')
  })

  it('keeps emoji intact', () => {
    expect(cleanText('Mantap 🚀 kerja bagus ✅')).toBe('Mantap 🚀 kerja bagus ✅')
  })

  it('keeps a plain dash list intact', () => {
    expect(cleanText('- satu\n- dua')).toBe('- satu\n- dua')
  })

  it('normalizes special hyphens to a plain dash', () => {
    // e‑book pakai non-breaking hyphen; real‐time pakai hyphen
    expect(cleanText('e‑book real‐time')).toBe('e-book real-time')
  })

  it('normalizes non-breaking and thin spaces to a normal space', () => {
    expect(cleanText('harga Rp 100 ribu')).toBe('harga Rp 100 ribu')
  })

  it('trims stray leading whitespace on lines', () => {
    expect(cleanText('Judul\n   https://contoh.com')).toBe('Judul\nhttps://contoh.com')
  })

  it('collapses 3+ blank lines and trims edges', () => {
    expect(cleanText('  a\n\n\n\nb  ')).toBe('a\n\nb')
  })
})
