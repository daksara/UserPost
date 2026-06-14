import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Composer } from './Composer'
import { createT } from '../i18n/translations'

afterEach(cleanup)
const t = createT('id')

const baseProps = {
  value: '',
  onChange: () => {},
  onSubmit: () => {},
  onStop: () => {},
  streaming: false,
  placeholder: 'Tulis...',
  templates: [{ id: 'x', title: 'TestTpl', desc: 'desc', system: '', starter: '' }],
  onPickTemplate: () => {},
}

describe('<Composer />', () => {
  it('disables send when input is empty', () => {
    render(<Composer {...baseProps} />)
    expect(screen.getByLabelText(t('composer.send'))).toBeDisabled()
  })

  it('submits on click when there is text', () => {
    const onSubmit = vi.fn()
    render(<Composer {...baseProps} value="hi" onSubmit={onSubmit} />)
    fireEvent.click(screen.getByLabelText(t('composer.send')))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('submits on Enter without shift', () => {
    const onSubmit = vi.fn()
    render(<Composer {...baseProps} value="hi" onSubmit={onSubmit} />)
    fireEvent.keyDown(screen.getByPlaceholderText('Tulis...'), { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('opens the template menu and picks a template', () => {
    const onPickTemplate = vi.fn()
    render(<Composer {...baseProps} onPickTemplate={onPickTemplate} />)
    fireEvent.click(screen.getByLabelText(t('composer.pickTemplate')))
    fireEvent.click(screen.getByText('TestTpl'))
    expect(onPickTemplate).toHaveBeenCalledWith('x')
  })

  it('shows the stop button while streaming', () => {
    const onStop = vi.fn()
    render(<Composer {...baseProps} streaming onStop={onStop} />)
    fireEvent.click(screen.getByLabelText(t('composer.stop')))
    expect(onStop).toHaveBeenCalledOnce()
  })
})
