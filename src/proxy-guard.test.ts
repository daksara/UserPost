import { describe, expect, it } from 'vitest'
import { isAllowedPath } from '../api/proxy'

describe('isAllowedPath', () => {
  it('mengizinkan endpoint model & chat Groq', () => {
    expect(isAllowedPath('groq', 'models')).toBe(true)
    expect(isAllowedPath('groq', 'chat/completions')).toBe(true)
    expect(isAllowedPath('groq', '/chat/completions')).toBe(true)
  })

  it('mengizinkan daftar model & streaming Gemini (dengan query)', () => {
    expect(isAllowedPath('gemini', 'models')).toBe(true)
    expect(isAllowedPath('gemini', 'models?pageSize=200')).toBe(true)
    expect(
      isAllowedPath('gemini', 'models/gemini-1.5-flash:streamGenerateContent?alt=sse'),
    ).toBe(true)
    expect(isAllowedPath('gemini', 'models/gemini-1.5-pro:generateContent')).toBe(true)
  })

  it('menolak path di luar allow-list', () => {
    expect(isAllowedPath('groq', 'files')).toBe(false)
    expect(isAllowedPath('groq', 'models/../secrets')).toBe(false)
    expect(isAllowedPath('gemini', 'models/x:streamGenerateContent/../../etc')).toBe(false)
    expect(isAllowedPath('gemini', 'https://evil.example/models')).toBe(false)
    expect(isAllowedPath('unknown', 'models')).toBe(false)
  })
})
