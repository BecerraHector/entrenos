import type { Session, SetLog } from './model'
import { normalizeName } from './progress'

export interface PersonalRecord {
  exercise: string
  /** `weight` for loaded exercises (kg), `reps` for bodyweight ones. */
  kind: 'weight' | 'reps'
  value: number
  previous: number
}

const completedSets = (session: Session, key: string): SetLog[] =>
  session.exercises.filter((e) => normalizeName(e.name) === key).flatMap((e) => e.sets.filter((s) => s.done && s.reps > 0))

const maxOf = (values: number[]) => (values.length ? Math.max(...values) : 0)

/**
 * Personal records set in `session`, compared with every session finished before it.
 * First-time exercises and ties are not records.
 */
export function detectRecords(session: Session, allSessions: Session[]): PersonalRecord[] {
  const history = allSessions.filter((s) => s.id !== session.id && s.finishedAt < session.finishedAt)
  const seen = new Set<string>()
  const records: PersonalRecord[] = []

  for (const exercise of session.exercises) {
    const key = normalizeName(exercise.name)
    if (seen.has(key)) continue
    seen.add(key)

    const current = completedSets(session, key)
    if (current.length === 0) continue
    const previous = history.flatMap((s) => completedSets(s, key))
    if (previous.length === 0) continue

    const bestWeight = maxOf(current.map((s) => s.weight))
    const name = exercise.name.trim()
    if (bestWeight > 0) {
      const previousWeight = maxOf(previous.map((s) => s.weight))
      if (previousWeight > 0 && bestWeight > previousWeight) {
        records.push({ exercise: name, kind: 'weight', value: bestWeight, previous: previousWeight })
      }
    } else {
      const bestReps = maxOf(current.map((s) => s.reps))
      const previousReps = maxOf(previous.filter((s) => s.weight === 0).map((s) => s.reps))
      if (previousReps > 0 && bestReps > previousReps) {
        records.push({ exercise: name, kind: 'reps', value: bestReps, previous: previousReps })
      }
    }
  }
  return records
}

/** Local-time Monday 00:00 of the week containing `date`, as a comparable number. */
function weekStart(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - offset)
  return d.getTime()
}

function previousWeek(start: number): number {
  const d = new Date(start)
  d.setDate(d.getDate() - 7)
  return d.getTime()
}

/**
 * Consecutive weeks (Monday to Sunday) with at least one workout.
 * The current week does not break the streak until it is over.
 */
export function weeklyStreak(sessions: Session[], now: Date): number {
  const weeks = new Set(sessions.map((s) => weekStart(new Date(s.finishedAt))))
  let week = weekStart(now)
  if (!weeks.has(week)) week = previousWeek(week)
  let streak = 0
  while (weeks.has(week)) {
    streak++
    week = previousWeek(week)
  }
  return streak
}

export function sessionsThisWeek(sessions: Session[], now: Date): number {
  const current = weekStart(now)
  return sessions.filter((s) => weekStart(new Date(s.finishedAt)) === current).length
}
