/** A planned exercise inside a routine. */
export interface RoutineExercise {
  id: string
  name: string
  targetSets: number
  targetReps: number
  notes?: string
}

export interface Routine {
  id: string
  name: string
  description?: string
  exercises: RoutineExercise[]
  archived: boolean
  /** ISO 8601 timestamps. */
  createdAt: string
  updatedAt: string
}

export interface SetLog {
  reps: number
  /** Weight in kg. 0 means bodyweight / no load. */
  weight: number
  done: boolean
}

export interface ExerciseLog {
  /** Id of the RoutineExercise this log came from. */
  exerciseId: string
  /** Snapshot of the name, so history survives routine edits. */
  name: string
  sets: SetLog[]
}

export interface Session {
  id: string
  routineId: string
  /** Snapshot of the routine name at the time of the workout. */
  routineName: string
  startedAt: string
  finishedAt: string
  exercises: ExerciseLog[]
  notes?: string
}

/** Builds a random id. Works on plain http (LAN dev) where crypto.randomUUID is unavailable. */
export function createId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
