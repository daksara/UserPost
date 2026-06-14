// src/components/LevelQuiz.tsx
// Kuis konsep A/B/C/D multi-soal untuk tab Materi (Uji pemahaman per level):
// melangkah soal demi soal, beri warna benar/salah + penjelasan, lalu skor akhir.
import { useState } from 'react'
import type { QuizQuestion } from '../learn/quiz'
import { useI18n } from '../i18n/i18n'

const LETTERS = ['A', 'B', 'C', 'D']

export function LevelQuiz({
  title,
  questions,
  onBack,
  onScore,
}: {
  title: string
  questions: QuizQuestion[]
  onBack: () => void
  onScore?: (correct: number, total: number) => void
}) {
  const { lang, t } = useI18n()
  const [step, setStep] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const total = questions.length
  const q = questions[step]
  const answered = chosen !== null
  const isLast = step === total - 1

  function choose(i: number) {
    if (answered) return
    setChosen(i)
    if (i === q.correct) setScore((s) => s + 1)
  }

  function next() {
    if (isLast) {
      onScore?.(score, total)
      setDone(true)
      return
    }
    setStep((s) => s + 1)
    setChosen(null)
  }

  if (done) {
    return (
      <div className="quiz">
        <button className="pdr-link quiz__back" onClick={onBack}>
          {t('quiz.back')}
        </button>
        <p className="quiz__score">{t('quiz.score', { correct: score, total })}</p>
      </div>
    )
  }

  return (
    <div className="quiz">
      <button className="pdr-link quiz__back" onClick={onBack}>
        {t('quiz.back')}
      </button>
      <p className="quiz__progress">
        {title} - {t('quiz.progress', { current: step + 1, total })}
      </p>
      <p className="quiz__prompt">{q.prompt[lang]}</p>

      <div className="quiz__options">
        {q.options.map((o, i) => {
          const state = !answered
            ? ''
            : i === q.correct
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
              chosen === q.correct ? ' quiz__verdict--ok' : ' quiz__verdict--no'
            }`}
          >
            {chosen === q.correct ? t('quiz.correct') : t('quiz.wrong')}
          </div>
          <ul className="quiz__exp">
            {q.options.map((o, i) => (
              <li key={i} className={i === q.correct ? 'quiz__exp--correct' : ''}>
                <strong>{LETTERS[i]}.</strong> {o.explanation[lang]}
              </li>
            ))}
          </ul>
          <button className="pdr-btn pdr-btn--primary" onClick={next}>
            {isLast ? t('quiz.finish') : t('quiz.next')}
          </button>
        </>
      )}
    </div>
  )
}
