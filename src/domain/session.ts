import type { ExerciseLog, Routine, Session } from './model'

/** Creates the editable set list for a new workout, reusing last session's numbers when available. */
export function buildSessionDraft(routine: Routine, previous: Session | undefined): ExerciseLog[] {
  return routine.exercises.map((exercise) => {
    const last = previous?.exercises.find((e) => e.exerciseId === exercise.id)?.sets ?? []
    const sets = Array.from({ length: exercise.targetSets }, (_, i) => {
      const ref = last[i] ?? last[last.length - 1]
      return { reps: ref?.reps ?? exercise.targetReps, weight: ref?.weight ?? 0, done: false }
    })
    return { exerciseId: exercise.id, name: exercise.name, sets }
  })
}

export const BACKUP_REMINDER_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

export function daysSinceBackup(lastExportAt: string | undefined, now: Date): number | undefined {
  if (!lastExportAt) return undefined
  return Math.floor((now.getTime() - new Date(lastExportAt).getTime()) / DAY_MS)
}

export function isBackupDue(lastExportAt: string | undefined, hasData: boolean, now: Date): boolean {
  if (!hasData) return false
  const days = daysSinceBackup(lastExportAt, now)
  return days === undefined || days >= BACKUP_REMINDER_DAYS
}
