import { afterEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSettings } from './useSettings'

afterEach(() => localStorage.clear())

describe('useSettings', () => {
  it('defaults to groq and is not ready without a key', () => {
    const { result } = renderHook(() => useSettings())
    expect(result.current.provider).toBe('groq')
    expect(result.current.ready).toBe(false)
  })

  it('becomes ready once an api key is set', () => {
    const { result } = renderHook(() => useSettings())
    act(() => result.current.setApiKey('groq', 'sk-test'))
    expect(result.current.apiKey).toBe('sk-test')
    expect(result.current.ready).toBe(true)
  })

  it('keeps per-provider keys separate when switching provider', () => {
    const { result } = renderHook(() => useSettings())
    act(() => result.current.setApiKey('groq', 'g-key'))
    act(() => result.current.setProvider('gemini'))
    expect(result.current.provider).toBe('gemini')
    expect(result.current.apiKey).toBe('')
    expect(result.current.ready).toBe(false)
  })

  it('persists language to localStorage', () => {
    const { result } = renderHook(() => useSettings())
    act(() => result.current.setLanguage('en'))
    const saved = JSON.parse(localStorage.getItem('pendar-settings') || '{}')
    expect(saved.language).toBe('en')
  })
})
