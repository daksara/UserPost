import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ClientQuiz } from './ClientQuiz'
import { createT } from '../i18n/translations'
import type { QuizQuestion } from '../learn/quiz'

afterEach(cleanup)
const t = createT('id')

const question: QuizQuestion = {
  id: 'q',
  prompt: { id: 'Balasan terbaik?', en: 'Best reply?' },
  correct: 1,
  options: [
    { text: { id: 'Opsi A', en: 'Option A' }, explanation: { id: 'kenapa A', en: 'why A' } },
    { text: { id: 'Opsi B', en: 'Option B' }, explanation: { id: 'kenapa B', en: 'why B' } },
    { text: { id: 'Opsi C', en: 'Option C' }, explanation: { id: 'kenapa C', en: 'why C' } },
    { text: { id: 'Opsi D', en: 'Option D' }, explanation: { id: 'kenapa D', en: 'why D' } },
  ],
}

describe('<ClientQuiz />', () => {
  it('marks a correct choice', () => {
    render(<ClientQuiz situation="Situasi" question={question} onBack={() => {}} />)
    fireEvent.click(screen.getByText('Opsi B'))
    expect(screen.getByText(t('quiz.correct'))).toBeInTheDocument()
  })

  it('marks a wrong choice and reveals explanations', () => {
    render(<ClientQuiz situation="Situasi" question={question} onBack={() => {}} />)
    fireEvent.click(screen.getByText('Opsi A'))
    expect(screen.getByText(t('quiz.wrong'))).toBeInTheDocument()
    expect(screen.getByText(/kenapa B/)).toBeInTheDocument()
  })
})
