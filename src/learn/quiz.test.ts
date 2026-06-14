import { describe, expect, it } from 'vitest'
import { SCENARIOS } from './scenarios'
import { LEVELS } from './curriculum'
import {
  LEVEL_QUIZZES,
  SCENARIO_QUIZZES,
  TOTAL_LEVEL_QUESTIONS,
  TOTAL_SCENARIO_QUIZZES,
  isCorrect,
  levelQuiz,
  scenarioQuiz,
  scoreAnswers,
} from './quiz'

const all = Object.values(SCENARIO_QUIZZES)

describe('SCENARIO_QUIZZES data', () => {
  it('has a quiz for every scenario', () => {
    const scenarioIds = new Set(SCENARIOS.map((s) => s.id))
    for (const s of SCENARIOS) expect(SCENARIO_QUIZZES[s.id]).toBeTruthy()
    for (const id of Object.keys(SCENARIO_QUIZZES)) expect(scenarioIds.has(id)).toBe(true)
    expect(TOTAL_SCENARIO_QUIZZES).toBe(SCENARIOS.length)
  })

  it('each question has exactly 4 options, a valid correct index, bilingual texts', () => {
    for (const q of all) {
      expect(q.options).toHaveLength(4)
      expect(q.correct).toBeGreaterThanOrEqual(0)
      expect(q.correct).toBeLessThan(4)
      expect(q.prompt.id).toBeTruthy()
      expect(q.prompt.en).toBeTruthy()
      for (const o of q.options) {
        expect(o.text.id).toBeTruthy()
        expect(o.text.en).toBeTruthy()
        expect(o.explanation.id).toBeTruthy()
        expect(o.explanation.en).toBeTruthy()
      }
    }
  })
})

describe('helpers', () => {
  it('scenarioQuiz finds and misses correctly', () => {
    expect(scenarioQuiz(SCENARIOS[0].id)?.id).toBe(SCENARIOS[0].id)
    expect(scenarioQuiz('nope')).toBeUndefined()
  })

  it('isCorrect compares the chosen index', () => {
    const q = all[0]
    expect(isCorrect(q, q.correct)).toBe(true)
    expect(isCorrect(q, (q.correct + 1) % 4)).toBe(false)
  })

  it('scoreAnswers counts correct answers', () => {
    const qs = all.slice(0, 3)
    const answers: Record<string, number> = {}
    qs.forEach((q, i) => (answers[q.id] = i === 0 ? q.correct : (q.correct + 1) % 4))
    expect(scoreAnswers(qs, answers)).toEqual({ correct: 1, total: 3 })
  })
})

describe('LEVEL_QUIZZES data', () => {
  const levelGroups = Object.values(LEVEL_QUIZZES)
  const levelQuestions = levelGroups.reduce(
    (acc, qs) => [...acc, ...qs],
    [] as (typeof levelGroups)[number],
  )

  it('has questions for every level', () => {
    for (const lvl of LEVELS) {
      expect(LEVEL_QUIZZES[lvl.id]).toBeTruthy()
      expect(LEVEL_QUIZZES[lvl.id].length).toBeGreaterThan(0)
    }
  })

  it('counts total questions', () => {
    expect(TOTAL_LEVEL_QUESTIONS).toBe(levelQuestions.length)
  })

  it('each question has 4 options, a valid correct index, bilingual texts', () => {
    for (const q of levelQuestions) {
      expect(q.options).toHaveLength(4)
      expect(q.correct).toBeGreaterThanOrEqual(0)
      expect(q.correct).toBeLessThan(4)
      expect(q.prompt.id).toBeTruthy()
      expect(q.prompt.en).toBeTruthy()
      for (const o of q.options) {
        expect(o.text.id).toBeTruthy()
        expect(o.text.en).toBeTruthy()
        expect(o.explanation.id).toBeTruthy()
        expect(o.explanation.en).toBeTruthy()
      }
    }
  })

  it('levelQuiz returns the array for a level', () => {
    expect(levelQuiz(LEVELS[0].id)).toBe(LEVEL_QUIZZES[LEVELS[0].id])
  })

  it('question ids are unique', () => {
    const ids = levelQuestions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
