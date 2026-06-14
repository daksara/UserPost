import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LevelQuiz } from './LevelQuiz'
import { createT } from '../i18n/translations'
import type { QuizQuestion } from '../learn/quiz'

afterEach(cleanup)
const t = createT('id')

const questions: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: { id: 'Soal satu?', en: 'Question one?' },
    correct: 0,
    options: [
      { text: { id: 'A1', en: 'A1' }, explanation: { id: 'jelas A1', en: 'why A1' } },
      { text: { id: 'B1', en: 'B1' }, explanation: { id: 'jelas B1', en: 'why B1' } },
      { text: { id: 'C1', en: 'C1' }, explanation: { id: 'jelas C1', en: 'why C1' } },
      { text: { id: 'D1', en: 'D1' }, explanation: { id: 'jelas D1', en: 'why D1' } },
    ],
  },
  {
    id: 'q2',
    prompt: { id: 'Soal dua?', en: 'Question two?' },
    correct: 1,
    options: [
      { text: { id: 'A2', en: 'A2' }, explanation: { id: 'jelas A2', en: 'why A2' } },
      { text: { id: 'B2', en: 'B2' }, explanation: { id: 'jelas B2', en: 'why B2' } },
      { text: { id: 'C2', en: 'C2' }, explanation: { id: 'jelas C2', en: 'why C2' } },
      { text: { id: 'D2', en: 'D2' }, explanation: { id: 'jelas D2', en: 'why D2' } },
    ],
  },
]

describe('<LevelQuiz />', () => {
  it('steps through questions and shows a final score', () => {
    render(<LevelQuiz title="Pemula" questions={questions} onBack={() => {}} />)
    fireEvent.click(screen.getByText('A1'))
    expect(screen.getByText(t('quiz.correct'))).toBeInTheDocument()
    fireEvent.click(screen.getByText(t('quiz.next')))
    fireEvent.click(screen.getByText('A2'))
    expect(screen.getByText(t('quiz.wrong'))).toBeInTheDocument()
    fireEvent.click(screen.getByText(t('quiz.finish')))
    expect(screen.getByText(t('quiz.score', { correct: 1, total: 2 }))).toBeInTheDocument()
  })
})
