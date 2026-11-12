import { describe, expect, it } from 'vitest'
import { makeSession } from './fixtures'
import { exerciseProgress, sessionStats, trackedExercises } from './progress'

describe('exerciseProgress', () => {
  it('returns best weight and volume per session, oldest first, counting only completed sets', () => {
    const later = makeSession({
      id: 's2',
      finishedAt: '2026-01-09T11:00:00.000Z',
      exercises: [
        {
          exerciseId: 'e1',
          name: 'Bench press',
          sets: [
            { reps: 8, weight: 70, done: true },
            { reps: 8, weight: 100, done: false },
          ],
        },
      ],
    })
    const earlier = makeSession()
    expect(exerciseProgress([later, earlier], 'Bench press')).toEqual([
      { date: '2026-01-02T11:00:00.000Z', bestWeight: 65, bestReps: 8, volume: 8 * 60 + 8 * 62.5 + 6 * 65, sets: 3 },
      { date: '2026-01-09T11:00:00.000Z', bestWeight: 70, bestReps: 8, volume: 560, sets: 1 },
    ])
  })

  it('matches the exercise name ignoring case and surrounding spaces', () => {
    const session = makeSession({
      exercises: [{ exerciseId: 'x', name: '  bench PRESS ', sets: [{ reps: 5, weight: 80, done: true }] }],
    })
    expect(exerciseProgress([session], 'Bench press')).toHaveLength(1)
  })

  it('skips sessions where the exercise has no completed sets', () => {
    const session = makeSession({
      exercises: [{ exerciseId: 'e1', name: 'Bench press', sets: [{ reps: 8, weight: 60, done: false }] }],
    })
    expect(exerciseProgress([session], 'Bench press')).toEqual([])
  })
})

describe('trackedExercises', () => {
  it('lists each exercise with completed sets once, sorted by name', () => {
    const a = makeSession()
    const b = makeSession({
      id: 's2',
      exercises: [
        { exerciseId: 'e9', name: 'bench press', sets: [{ reps: 1, weight: 1, done: true }] },
        { exerciseId: 'e8', name: 'Squat', sets: [{ reps: 5, weight: 100, done: true }] },
        { exerciseId: 'e7', name: 'Skipped', sets: [{ reps: 5, weight: 100, done: false }] },
      ],
    })
    expect(trackedExercises([a, b])).toEqual(['Bench press', 'Squat'])
  })
})

describe('sessionStats', () => {
  it('counts completed sets and their volume', () => {
    const session = makeSession()
    session.exercises[0].sets[2].done = false
    expect(sessionStats(session)).toEqual({ sets: 2, volume: 8 * 60 + 8 * 62.5 })
  })
})
