import { describe, expect, it } from 'vitest'
import { makeRoutine, makeSession } from './fixtures'
import { buildSessionDraft, daysSinceBackup, isBackupDue } from './session'

describe('buildSessionDraft', () => {
  it('creates target sets for each exercise, prefilled from the previous session', () => {
    const draft = buildSessionDraft(makeRoutine(), makeSession())
    expect(draft).toEqual([
      {
        exerciseId: 'e1',
        name: 'Bench press',
        sets: [
          { reps: 8, weight: 60, done: false },
          { reps: 8, weight: 62.5, done: false },
          { reps: 6, weight: 65, done: false },
        ],
      },
      {
        exerciseId: 'e2',
        name: 'Push-ups',
        sets: [
          { reps: 15, weight: 0, done: false },
          { reps: 15, weight: 0, done: false },
        ],
      },
    ])
  })

  it('uses the last previous set when the target has more sets than last time', () => {
    const routine = makeRoutine({ exercises: [{ id: 'e1', name: 'Bench press', targetSets: 4, targetReps: 8 }] })
    const draft = buildSessionDraft(routine, makeSession())
    expect(draft[0].sets[3]).toEqual({ reps: 6, weight: 65, done: false })
  })

  it('uses routine targets when there is no previous session', () => {
    const draft = buildSessionDraft(makeRoutine(), undefined)
    expect(draft[0].sets).toEqual([
      { reps: 8, weight: 0, done: false },
      { reps: 8, weight: 0, done: false },
      { reps: 8, weight: 0, done: false },
    ])
  })
})

describe('backup reminder', () => {
  const now = new Date('2026-03-15T12:00:00.000Z')

  it('counts whole days since the last export', () => {
    expect(daysSinceBackup('2026-03-01T12:00:00.000Z', now)).toBe(14)
    expect(daysSinceBackup(undefined, now)).toBeUndefined()
  })

  it('is due after 14 days, or when there is data and no backup yet', () => {
    expect(isBackupDue('2026-03-01T12:00:00.000Z', true, now)).toBe(true)
    expect(isBackupDue('2026-03-02T12:00:00.000Z', true, now)).toBe(false)
    expect(isBackupDue(undefined, true, now)).toBe(true)
  })

  it('is not due when there is nothing to back up', () => {
    expect(isBackupDue(undefined, false, now)).toBe(false)
    expect(isBackupDue('2026-01-01T12:00:00.000Z', false, now)).toBe(false)
  })
})
