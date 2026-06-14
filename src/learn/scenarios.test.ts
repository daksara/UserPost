import { describe, expect, it } from 'vitest'
import { LEVELS } from './curriculum'
import {
  SCENARIOS,
  TOTAL_SCENARIOS,
  buildClientSystem,
  buildEvalSystem,
  findScenario,
  scenariosByLevel,
} from './scenarios'

describe('SCENARIOS data', () => {
  it('has scenarios with unique ids', () => {
    expect(TOTAL_SCENARIOS).toBeGreaterThan(0)
    const ids = SCENARIOS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only uses known levels and bilingual fields', () => {
    const levels = new Set(LEVELS.map((l) => l.id))
    for (const s of SCENARIOS) {
      expect(levels.has(s.level)).toBe(true)
      expect(s.skill.id).toBeTruthy()
      expect(s.skill.en).toBeTruthy()
      expect(s.rubric.length).toBeGreaterThan(0)
    }
  })

  it('covers every level', () => {
    for (const lvl of LEVELS) {
      expect(scenariosByLevel(lvl.id).length).toBeGreaterThan(0)
    }
  })

  it('scenariosByLevel partitions the full set', () => {
    const sum = LEVELS.reduce((n, l) => n + scenariosByLevel(l.id).length, 0)
    expect(sum).toBe(TOTAL_SCENARIOS)
  })
})

describe('findScenario', () => {
  it('finds an existing scenario and returns undefined otherwise', () => {
    expect(findScenario(SCENARIOS[0].id)?.id).toBe(SCENARIOS[0].id)
    expect(findScenario('does-not-exist')).toBeUndefined()
  })
})

describe('buildClientSystem', () => {
  it('puts the persona in character in the chosen language', () => {
    const s = SCENARIOS[0]
    const out = buildClientSystem(s, 'id')
    expect(out).toContain(s.clientName)
    expect(out).toContain(s.situation.id)
    expect(out).toContain('Indonesian')
    expect(out.toLowerCase()).toContain('in character')
  })
})

describe('buildEvalSystem', () => {
  it('includes the rubric and a verdict instruction', () => {
    const s = SCENARIOS[0]
    const out = buildEvalSystem(s, 'en')
    expect(out).toContain(s.rubric[0])
    expect(out).toContain('Pass')
    expect(out).toContain('English')
  })
})
