import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MessageBubble } from './MessageBubble'
import { createT } from '../i18n/translations'

afterEach(cleanup)
const t = createT('id')

describe('<MessageBubble />', () => {
  it('renders a user message as plain text', () => {
    render(<MessageBubble turn={{ id: '1', role: 'user', content: 'Halo dunia' }} streaming={false} />)
    expect(screen.getByText('Halo dunia')).toBeInTheDocument()
  })

  it('shows a copy button for a non-empty assistant message', () => {
    render(<MessageBubble turn={{ id: '2', role: 'assistant', content: 'Jawaban AI' }} streaming={false} />)
    expect(screen.getByText('Jawaban AI')).toBeInTheDocument()
    expect(screen.getByText(t('msg.copy'))).toBeInTheDocument()
  })

  it('renders no copy button for an empty streaming assistant turn', () => {
    render(<MessageBubble turn={{ id: '3', role: 'assistant', content: '' }} streaming={true} />)
    expect(screen.queryByText(t('msg.copy'))).toBeNull()
  })
})
