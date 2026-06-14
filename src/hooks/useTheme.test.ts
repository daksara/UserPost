import { afterEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTheme } from './useTheme'

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('useTheme', () => {
  it('defaults to dark and applies the attribute', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('cycles from dark to light and persists it', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.cycleTheme())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('pendar-theme')).toBe('light')
  })

  it('sets a specific theme', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('light'))
    expect(result.current.theme).toBe('light')
  })
})
