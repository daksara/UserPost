// src/components/ClientQuiz.tsx
// Kuis interaktif A/B/C/D untuk Latihan Klien: pilih balasan terbaik, lalu lihat
// benar/salah + penjelasan tiap opsi. Murni tap, tanpa AI, tanpa ketik.
import { useState } from 'react'
import type { QuizQuestion } from '../learn/quiz'
import { useI18n } from '../i18n/i18n'

const LETTERS = ['A', 'B', 'C', 'D']

export function ClientQuiz({
  situation,
  question,
  onBack,
  onResult,
}: {
  situation: string
  question: QuizQuestion
  onBack: () => void
  onResult?: (correct: number, total: number) => void
}) {
  const { lang, t } = useI18n()
  const [chosen, setChosen] = useState<number | null>(null)
  const answered = chosen !== null

  function choose(i: number) {
    if (answered) return
    setChosen(i)
    onResult?.(i === question.correct ? 1 : 0, 1)
  }

  return (
    <div className="quiz">
      <button className="pdr-link quiz__back" onClick={onBack}>
        {t('quiz.back')}
      </button>
      <p className="quiz__situation">{situation}</p>
      <p className="quiz__prompt">{question.prompt[lang]}</p>

      <div className="quiz__options">
        {question.options.map((o, i) => {
          const state = !answered
            ? ''
            : i === question.correct
              ? ' quiz__opt--correct'
              : i === chosen
                ? ' quiz__opt--wrong'
                : ''
          return (
            <button
              key={i}
              className={`quiz__opt${state}`}
              disabled={answered}
              onClick={() => choose(i)}
            >
              <span className="quiz__opt-letter">{LETTERS[i]}</span>
              <span className="quiz__opt-text">{o.text[lang]}</span>
            </button>
          )
        })}
      </div>

      {answered && (
        <>
          <div
            className={`quiz__verdict${
              chosen === question.correct ? ' quiz__verdict--ok' : ' quiz__verdict--no'
            }`}
          >
            {chosen === question.correct ? t('quiz.correct') : t('quiz.wrong')}
          </div>
          <ul className="quiz__exp">
            {question.options.map((o, i) => (
              <li key={i} className={i === question.correct ? 'quiz__exp--correct' : ''}>
                <strong>{LETTERS[i]}.</strong> {o.explanation[lang]}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
