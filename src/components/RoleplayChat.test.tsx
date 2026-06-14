import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RoleplayChat } from './RoleplayChat'
import { createT } from '../i18n/translations'
import type { RoleplayStep } from '../learn/roleplay'

afterEach(cleanup)
const t = createT('id')

const steps: RoleplayStep[] = [
  {
    client: { id: 'Halo, kamu bisa apa?', en: 'Hi, what can you do?' },
    correct: 0,
    options: [
      { text: { id: 'Jawaban A1', en: 'Reply A1' }, explanation: { id: 'kenapa A1', en: 'why A1' } },
      { text: { id: 'Jawaban B1', en: 'Reply B1' }, explanation: { id: 'kenapa B1', en: 'why B1' } },
      { text: { id: 'Jawaban C1', en: 'Reply C1' }, explanation: { id: 'kenapa C1', en: 'why C1' } },
      { text: { id: 'Jawaban D1', en: 'Reply D1' }, explanation: { id: 'kenapa D1', en: 'why D1' } },
    ],
  },
  {
    client: { id: 'Oke, lanjut.', en: 'Ok, go on.' },
    correct: 1,
    options: [
      { text: { id: 'Jawaban A2', en: 'Reply A2' }, explanation: { id: 'kenapa A2', en: 'why A2' } },
      { text: { id: 'Jawaban B2', en: 'Reply B2' }, explanation: { id: 'kenapa B2', en: 'why B2' } },
      { text: { id: 'Jawaban C2', en: 'Reply C2' }, explanation: { id: 'kenapa C2', en: 'why C2' } },
      { text: { id: 'Jawaban D2', en: 'Reply D2' }, explanation: { id: 'kenapa D2', en: 'why D2' } },
    ],
  },
]

describe('<RoleplayChat />', () => {
  it('plays through turns, shows feedback, and ends with a score', () => {
    render(
      <RoleplayChat
        clientName="Bu Rina"
        business="toko online"
        situation="Situasi awal"
        steps={steps}
        onBack={() => {}}
      />,
    )
    expect(screen.getByText('Halo, kamu bisa apa?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Jawaban A1'))
    expect(screen.getByText(t('quiz.correct'))).toBeInTheDocument()
    expect(screen.getByText(/kenapa B1/)).toBeInTheDocument()
    fireEvent.click(screen.getByText(t('quiz.next')))
    expect(screen.getByText('Oke, lanjut.')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Jawaban A2'))
    expect(screen.getByText(t('quiz.wrong'))).toBeInTheDocument()
    fireEvent.click(screen.getByText(t('quiz.finish')))
    expect(screen.getByText(t('quiz.score', { correct: 1, total: 2 }))).toBeInTheDocument()
  })
})
