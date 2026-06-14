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

  it('removes emoji', () => {
    expect(cleanText('Mantap 🚀 kerja bagus ✅')).toBe('Mantap  kerja bagus')
  })

  it('keeps a plain dash list intact', () => {
    expect(cleanText('- satu\n- dua')).toBe('- satu\n- dua')
  })
})
