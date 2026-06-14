// src/components/LearnModal.tsx
// Belajar Virtual Assistant: dua tab — Materi (kurikulum berjenjang yang diajar
// mentor AI) dan Latihan Klien (AI berperan sebagai klien, learner berlatih).
import { useEffect, useRef, useState } from 'react'
import { LEVELS, TOTAL_LESSONS, lessonsByLevel } from '../learn/curriculum'
import { scenariosByLevel } from '../learn/scenarios'
import { levelProgress, overallPercent } from '../learn/progress'
import { useI18n } from '../i18n/i18n'

interface Props {
  completed: Set<string>
  onToggleDone: (id: string) => void
  onStartLesson: (id: string) => void
  onStartScenario: (id: string) => void
  onClose: () => void
}

export function LearnModal({
  completed,
  onToggleDone,
  onStartLesson,
  onStartScenario,
  onClose,
}: Props) {
  const { lang, t } = useI18n()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [tab, setTab] = useState<'lessons' | 'sim'>('lessons')

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const percent = overallPercent(completed)
  const doneCount = LEVELS.reduce(
    (n, lvl) => n + lessonsByLevel(lvl.id).filter((l) => completed.has(l.id)).length,
    0,
  )
  const byLevel = levelProgress(completed)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--wide"
        role="dialog"
        aria-modal="true"
        aria-label={t('sidebar.learnVA')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <h2 className="modal__title">{t('sidebar.learnVA')}</h2>
          <button ref={closeRef} className="pdr-nav-btn" onClick={onClose}>
            {t('settings.close')}
          </button>
        </div>

        <div className="learn__tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'lessons'}
            className={`learn__tab${tab === 'lessons' ? ' learn__tab--active' : ''}`}
            onClick={() => setTab('lessons')}
          >
            {t('learn.tabLessons')}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'sim'}
            className={`learn__tab${tab === 'sim' ? ' learn__tab--active' : ''}`}
            onClick={() => setTab('sim')}
          >
            {t('learn.tabSim')}
          </button>
        </div>

        {tab === 'lessons' ? (
          <>
            <p className="learn__intro">{t('learn.intro')}</p>

            <div className="learn__overall">
              <div className="learn__overall-row">
                <span>{t('learn.overall')}</span>
                <span>
                  {t('learn.overallCount', { done: doneCount, total: TOTAL_LESSONS, percent })}
                </span>
              </div>
              <div
                className="learn__bar"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="learn__bar-fill" style={{ width: `${percent}%` }} />
              </div>
            </div>

            <div className="learn__levels">
              {LEVELS.map((lvl) => {
                const prog = byLevel.find((p) => p.level === lvl.id)
                return (
                  <section key={lvl.id} className="learn__level">
                    <div className="learn__level-head">
                      <div>
                        <h3 className="learn__level-title">{lvl.title[lang]}</h3>
                        <p className="learn__level-tag">{lvl.tagline[lang]}</p>
                      </div>
                      {prog && (
                        <span className="chip">
                          {prog.done}/{prog.total}
                        </span>
                      )}
                    </div>

                    <div className="learn__lessons">
                      {lessonsByLevel(lvl.id).map((lesson) => {
                        const done = completed.has(lesson.id)
                        return (
                          <div
                            key={lesson.id}
                            className={`learn-card${done ? ' learn-card--done' : ''}`}
                          >
                            <div className="learn-card__main">
                              <div className="learn-card__title">{lesson.title[lang]}</div>
                              <div className="learn-card__summary">{lesson.summary[lang]}</div>
                              <ul className="learn-card__objectives">
                                {lesson.objectives[lang].map((o, i) => (
                                  <li key={i}>{o}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="learn-card__actions">
                              <button
                                className="pdr-btn pdr-btn--primary"
                                onClick={() => onStartLesson(lesson.id)}
                              >
                                {done ? t('learn.repeat') : t('learn.start')}
                              </button>
                              <label className="learn-card__check">
                                <input
                                  type="checkbox"
                                  checked={done}
                                  onChange={() => onToggleDone(lesson.id)}
                                />
                                {t('learn.done')}
                              </label>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <p className="learn__intro">{t('learn.simIntro')}</p>

            <div className="learn__levels">
              {LEVELS.map((lvl) => (
                <section key={lvl.id} className="learn__level">
                  <div className="learn__level-head">
                    <div>
                      <h3 className="learn__level-title">{lvl.title[lang]}</h3>
                      <p className="learn__level-tag">{lvl.tagline[lang]}</p>
                    </div>
                  </div>

                  <div className="learn__lessons">
                    {scenariosByLevel(lvl.id).map((s) => (
                      <div key={s.id} className="learn-card">
                        <div className="learn-card__main">
                          <div className="learn-card__title">{s.skill[lang]}</div>
                          <div className="sim-card__meta">
                            {s.clientName} · {s.business[lang]} ·{' '}
                            {t('learn.simDifficulty', { n: s.difficulty })}
                          </div>
                          <div className="learn-card__summary">{s.situation[lang]}</div>
                        </div>
                        <div className="learn-card__actions">
                          <button
                            className="pdr-btn pdr-btn--primary"
                            onClick={() => onStartScenario(s.id)}
                          >
                            {t('learn.simStart')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
