import type { Session, SetLog } from './model'

export interface ProgressPoint {
  /** Session finish date (ISO). */
  date: string
  /** Heaviest weight lifted in a completed set. */
  bestWeight: number
  /** Most reps in a single completed set (useful for bodyweight exercises). */
  bestReps: number
  /** Sum of reps × weight over completed sets. */
  volume: number
  /** Number of completed sets. */
  sets: number
}

export const normalizeName = (name: string) => name.trim().toLowerCase()

const completed = (sets: SetLog[]) => sets.filter((s) => s.done && s.reps > 0)

/** Evolution of one exercise across sessions, oldest first. Exercises are matched by name. */
export function exerciseProgress(sessions: Session[], exerciseName: string): ProgressPoint[] {
  const key = normalizeName(exerciseName)
  const points: ProgressPoint[] = []
  for (const session of sessions) {
    const sets = session.exercises
      .filter((e) => normalizeName(e.name) === key)
      .flatMap((e) => completed(e.sets))
    if (sets.length === 0) continue
    points.push({
      date: session.finishedAt,
      bestWeight: Math.max(...sets.map((s) => s.weight)),
      bestReps: Math.max(...sets.map((s) => s.reps)),
      volume: sets.reduce((sum, s) => sum + s.reps * s.weight, 0),
      sets: sets.length,
    })
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

/** Distinct exercise names that have at least one completed set, sorted alphabetically. */
export function trackedExercises(sessions: Session[]): string[] {
  const names = new Map<string, string>()
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const key = normalizeName(exercise.name)
      if (!names.has(key) && completed(exercise.sets).length > 0) names.set(key, exercise.name.trim())
    }
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b))
}

/** Completed sets and total volume (reps × kg) of one session. */
export function sessionStats(session: Session): { sets: number; volume: number } {
  const sets = session.exercises.flatMap((e) => completed(e.sets))
  return { sets: sets.length, volume: sets.reduce((sum, s) => sum + s.reps * s.weight, 0) }
}
