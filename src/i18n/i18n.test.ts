import { afterEach, describe, expect, it } from 'vitest'
import { createT } from './translations'
import { getStoredLanguage } from './i18n'

afterEach(() => localStorage.clear())

describe('createT', () => {
  it('returns the Indonesian and English welcome titles', () => {
    expect(createT('id')('welcome.title')).toBe('Halo, aku Pendar')
    expect(createT('en')('welcome.title')).toBe("Hi, I'm Pendar")
  })
})

describe('getStoredLanguage', () => {
  it('defaults to id when nothing is stored', () => {
    expect(getStoredLanguage()).toBe('id')
  })

  it('reads a stored language', () => {
    localStorage.setItem('pendar-settings', JSON.stringify({ language: 'en' }))
    expect(getStoredLanguage()).toBe('en')
  })
})
