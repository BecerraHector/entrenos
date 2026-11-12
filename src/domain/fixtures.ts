import type { Routine, Session } from './model'

export function makeRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'r1',
    name: 'Push day',
    exercises: [
      { id: 'e1', name: 'Bench press', targetSets: 3, targetReps: 8 },
      { id: 'e2', name: 'Push-ups', targetSets: 2, targetReps: 15 },
    ],
    archived: false,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  }
}

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    routineId: 'r1',
    routineName: 'Push day',
    startedAt: '2026-01-02T10:00:00.000Z',
    finishedAt: '2026-01-02T11:00:00.000Z',
    exercises: [
      {
        exerciseId: 'e1',
        name: 'Bench press',
        sets: [
          { reps: 8, weight: 60, done: true },
          { reps: 8, weight: 62.5, done: true },
          { reps: 6, weight: 65, done: true },
        ],
      },
    ],
    ...overrides,
  }
}
