import { describe, expect, it } from 'vitest'
import {
  LESSONS,
  LEVELS,
  TOTAL_LESSONS,
  buildLessonStarter,
  buildLessonSystem,
  findLesson,
  lessonsByLevel,
} from './curriculum'
import { levelProgress, overallPercent, sanitizeCompleted } from './progress'

describe('curriculum data', () => {
  it('has unique lesson ids', () => {
    const ids = LESSONS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every lesson a valid level, title, summary, and objectives', () => {
    const levelIds = new Set(LEVELS.map((l) => l.id))
    for (const lesson of LESSONS) {
      expect(levelIds.has(lesson.level)).toBe(true)
      expect(lesson.title.trim()).toBeTruthy()
      expect(lesson.summary.trim()).toBeTruthy()
      expect(lesson.objectives.length).toBeGreaterThan(0)
      expect(lesson.focus.trim()).toBeTruthy()
    }
  })

  it('covers the full beginner-to-expert path with lessons in each level', () => {
    for (const level of LEVELS) {
      expect(lessonsByLevel(level.id).length).toBeGreaterThan(0)
    }
    expect(TOTAL_LESSONS).toBe(LESSONS.length)
    // Setiap materi termasuk dalam tepat satu level.
    const grouped = LEVELS.flatMap((l) => lessonsByLevel(l.id))
    expect(grouped.length).toBe(TOTAL_LESSONS)
  })

  it('finds a lesson by id and returns undefined for unknown ids', () => {
    expect(findLesson(LESSONS[0].id)?.id).toBe(LESSONS[0].id)
    expect(findLesson('does-not-exist')).toBeUndefined()
  })
})

describe('lesson prompt builders', () => {
  const lesson = LESSONS[0]

  it('embeds the lesson title and objectives in the system prompt', () => {
    const system = buildLessonSystem(lesson)
    expect(system).toContain('Pendar Mentor')
    expect(system).toContain(lesson.title)
    for (const obj of lesson.objectives) expect(system).toContain(obj)
  })

  it('builds a learner kickoff message referencing the lesson', () => {
    expect(buildLessonStarter(lesson)).toContain(lesson.title)
  })
})

describe('progress helpers', () => {
  it('keeps only valid, unique lesson ids', () => {
    const valid = LESSONS[0].id
    expect(sanitizeCompleted([valid, valid, 'bogus', 123, null])).toEqual([valid])
    expect(sanitizeCompleted('nope')).toEqual([])
  })

  it('counts completed lessons per level', () => {
    const first = lessonsByLevel('pemula')[0].id
    const prog = levelProgress([first])
    const pemula = prog.find((p) => p.level === 'pemula')
    expect(pemula?.done).toBe(1)
    expect(pemula?.total).toBe(lessonsByLevel('pemula').length)
  })

  it('computes overall percent from completed lessons', () => {
    expect(overallPercent([])).toBe(0)
    expect(overallPercent(LESSONS.map((l) => l.id))).toBe(100)
  })
})
