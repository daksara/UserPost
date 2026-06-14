import { describe, expect, it } from 'vitest'
import { SCENARIOS } from './scenarios'
import {
  ROLEPLAYS,
  ROLEPLAY_SCENARIO_IDS,
  TOTAL_ROLEPLAY_STEPS,
  roleplaySteps,
} from './roleplay'

const allSteps = Object.values(ROLEPLAYS).reduce(
  (acc, steps) => [...acc, ...steps],
  [] as (typeof ROLEPLAYS)[string],
)

describe('ROLEPLAYS data', () => {
  it('has a dialogue for every scenario', () => {
    const ids = new Set(SCENARIOS.map((s) => s.id))
    for (const s of SCENARIOS) expect(ROLEPLAYS[s.id]).toBeTruthy()
    for (const id of Object.keys(ROLEPLAYS)) expect(ids.has(id)).toBe(true)
  })

  it('each scenario has at least 2 steps', () => {
    for (const id of Object.keys(ROLEPLAYS)) {
      expect(ROLEPLAYS[id].length).toBeGreaterThanOrEqual(2)
    }
  })

  it('counts total steps', () => {
    expect(TOTAL_ROLEPLAY_STEPS).toBe(allSteps.length)
  })

  it('lists scenario ids in SCENARIOS order', () => {
    expect(ROLEPLAY_SCENARIO_IDS).toEqual(SCENARIOS.map((s) => s.id))
  })

  it('each step has a bilingual client line, 4 options, valid correct index', () => {
    for (const step of allSteps) {
      expect(step.client.id).toBeTruthy()
      expect(step.client.en).toBeTruthy()
      expect(step.options).toHaveLength(4)
      expect(step.correct).toBeGreaterThanOrEqual(0)
      expect(step.correct).toBeLessThan(4)
      for (const o of step.options) {
        expect(o.text.id).toBeTruthy()
        expect(o.text.en).toBeTruthy()
        expect(o.explanation.id).toBeTruthy()
        expect(o.explanation.en).toBeTruthy()
      }
    }
  })

  it('roleplaySteps finds and misses correctly', () => {
    expect(roleplaySteps(SCENARIOS[0].id)).toBe(ROLEPLAYS[SCENARIOS[0].id])
    expect(roleplaySteps('nope')).toEqual([])
  })
})
