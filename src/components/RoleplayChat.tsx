// src/components/RoleplayChat.tsx
// Roleplay percakapan bertahap dengan pilihan jawaban. Klien mengirim pesan tiap
// giliran, learner memilih A/B/C/D, lalu melihat balasannya, benar/salah, dan
// penjelasan tiap opsi (ala guru). Di akhir muncul skor. Murni tap, tanpa AI.
import { useState } from 'react'
import type { RoleplayStep } from '../learn/roleplay'
import { useI18n } from '../i18n/i18n'

const LETTERS = ['A', 'B', 'C', 'D']

export function RoleplayChat({
  clientName,
  business,
  situation,
  steps,
  onBack,
  onDone,
}: {
  clientName: string
  business: string
  situation: string
  steps: RoleplayStep[]
  onBack: () => void
  onDone?: (correct: number, total: number) => void
}) {
  const { lang, t } = useI18n()
  const [step, setStep] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const total = steps.length
  const cur = steps[step]
  const answered = chosen !== null
  const isLast = step === total - 1

  function choose(i: number) {
    if (answered) return
    setChosen(i)
    if (i === cur.correct) setScore((s) => s + 1)
  }

  function next() {
    if (isLast) {
      onDone?.(score, total)
      setDone(true)
      return
    }
    setStep((s) => s + 1)
    setChosen(null)
  }

  return (
    <div className="quiz rp">
      <button className="pdr-link quiz__back" onClick={onBack}>
        {t('quiz.back')}
      </button>

      {done ? (
        <p className="quiz__score">{t('quiz.score', { correct: score, total })}</p>
      ) : (
        <>
          <p className="quiz__situation">{situation}</p>
          <p className="quiz__progress">
            {clientName} ({business}) - {t('quiz.progress', { current: step + 1, total })}
          </p>

          <div className="rp__msg rp__client">{cur.client[lang]}</div>

          {!answered && (
            <div className="quiz__options">
              {cur.options.map((o, i) => (
                <button
                  key={i}
                  className="quiz__opt"
                  onClick={() => choose(i)}
                >
                  <span className="quiz__opt-letter">{LETTERS[i]}</span>
                  <span className="quiz__opt-text">{o.text[lang]}</span>
                </button>
              ))}
            </div>
          )}

          {answered && chosen !== null && (
            <>
              <div className="rp__msg rp__you">{cur.options[chosen].text[lang]}</div>
              <div
                className={`quiz__verdict${
                  chosen === cur.correct ? ' quiz__verdict--ok' : ' quiz__verdict--no'
                }`}
              >
                {chosen === cur.correct ? t('quiz.correct') : t('quiz.wrong')}
              </div>
              <ul className="quiz__exp">
                {cur.options.map((o, i) => (
                  <li key={i} className={i === cur.correct ? 'quiz__exp--correct' : ''}>
                    <strong>{LETTERS[i]}.</strong> {o.explanation[lang]}
                  </li>
                ))}
              </ul>
              <button className="pdr-btn pdr-btn--primary" onClick={next}>
                {isLast ? t('quiz.finish') : t('quiz.next')}
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
