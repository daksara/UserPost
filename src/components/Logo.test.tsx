import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Logo } from './Logo'

describe('<Logo />', () => {
  it('renders an accessible Pendar logo', () => {
    render(<Logo />)
    expect(screen.getByRole('img', { name: 'Pendar' })).toBeInTheDocument()
  })

  it('respects a custom size', () => {
    render(<Logo size={48} />)
    expect(screen.getByRole('img', { name: 'Pendar' })).toHaveAttribute('width', '48')
  })
})
