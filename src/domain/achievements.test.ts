import { describe, expect, it } from 'vitest'
import { detectRecords, sessionsThisWeek, weeklyStreak } from './achievements'
import { makeSession } from './fixtures'
import type { Session } from './model'

const bench = (weight: number, reps = 8, done = true) => ({ reps, weight, done })

function sessionWith(id: string, finishedAt: string, exercises: Session['exercises']): Session {
  return makeSession({ id, finishedAt, startedAt: finishedAt, exercises })
}

describe('detectRecords', () => {
  const old = sessionWith('a', '2026-01-01T10:00:00.000Z', [
    { exerciseId: 'e1', name: 'Bench press', sets: [bench(60), bench(62.5)] },
    { exerciseId: 'e2', name: 'Push-ups', sets: [bench(0, 15)] },
  ])

  it('reports a weight record when the best completed set beats every previous session', () => {
    const today = sessionWith('b', '2026-01-08T10:00:00.000Z', [
      { exerciseId: 'e1', name: 'bench press ', sets: [bench(65), bench(70, 3, false)] },
    ])
    expect(detectRecords(today, [old, today])).toEqual([{ exercise: 'bench press', kind: 'weight', value: 65, previous: 62.5 }])
  })

  it('reports a reps record for bodyweight exercises', () => {
    const today = sessionWith('b', '2026-01-08T10:00:00.000Z', [{ exerciseId: 'e2', name: 'Push-ups', sets: [bench(0, 18)] }])
    expect(detectRecords(today, [old])).toEqual([{ exercise: 'Push-ups', kind: 'reps', value: 18, previous: 15 }])
  })

  it('does not report ties, first-time exercises, or later sessions as history', () => {
    const tie = sessionWith('b', '2026-01-08T10:00:00.000Z', [{ exerciseId: 'e1', name: 'Bench press', sets: [bench(62.5)] }])
    const first = sessionWith('c', '2026-01-08T10:00:00.000Z', [{ exerciseId: 'e9', name: 'Squat', sets: [bench(100)] }])
    const future = sessionWith('z', '2026-02-01T10:00:00.000Z', [{ exerciseId: 'e1', name: 'Bench press', sets: [bench(200)] }])
    expect(detectRecords(tie, [old])).toEqual([])
    expect(detectRecords(first, [old])).toEqual([])
    const today = sessionWith('b', '2026-01-08T10:00:00.000Z', [{ exerciseId: 'e1', name: 'Bench press', sets: [bench(65)] }])
    expect(detectRecords(today, [old, future])).toHaveLength(1)
  })
})

describe('weeklyStreak', () => {
  // Local dates: weeks start on Monday. 2026-03-16 is a Monday.
  const at = (y: number, m: number, d: number) => makeSession({ id: `${y}-${m}-${d}`, finishedAt: new Date(y, m - 1, d, 18).toISOString() })
  const now = new Date(2026, 2, 18, 12) // Wednesday, week of Mar 16

  it('counts consecutive weeks with at least one workout, including the current week', () => {
    expect(weeklyStreak([at(2026, 3, 17), at(2026, 3, 10), at(2026, 3, 9), at(2026, 3, 2)], now)).toBe(3)
  })

  it('keeps the streak alive when the current week has no workout yet', () => {
    expect(weeklyStreak([at(2026, 3, 13), at(2026, 3, 6)], now)).toBe(2)
  })

  it('is 0 when the last workout was more than a week ago', () => {
    expect(weeklyStreak([at(2026, 3, 1)], now)).toBe(0)
    expect(weeklyStreak([], now)).toBe(0)
  })

  it('counts sessions in the current week', () => {
    expect(sessionsThisWeek([at(2026, 3, 16), at(2026, 3, 18), at(2026, 3, 15)], now)).toBe(2)
  })
})
