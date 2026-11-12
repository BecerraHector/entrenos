import type { ExerciseLog, Routine, RoutineExercise, Session, SetLog } from './model'

export const BACKUP_FORMAT = 'workout-tracker-backup'
/** Bump when the stored shape changes, and add a migration below. */
export const BACKUP_VERSION = 1

export interface AppData {
  routines: Routine[]
  sessions: Session[]
}

export interface BackupFile extends AppData {
  format: typeof BACKUP_FORMAT
  version: number
  exportedAt: string
}

export type ParseResult =
  | { ok: true; data: AppData; exportedAt: string }
  | { ok: false; error: string }

export function createBackup(data: AppData, now: Date): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    routines: data.routines,
    sessions: data.sessions,
  }
}

/**
 * Upgrades an older backup to the current shape, one version at a time.
 * Example for a future v2: `1: (raw) => ({ ...raw, version: 2, routines: raw.routines.map(...) })`.
 */
const migrations: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {}

class InvalidField extends Error {}

type Obj = Record<string, unknown>

function obj(value: unknown, path: string): Obj {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new InvalidField(path)
  return value as Obj
}
function arr(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new InvalidField(path)
  return value
}
function str(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new InvalidField(path)
  return value
}
function optStr(value: unknown, path: string): string | undefined {
  return value === undefined ? undefined : str(value, path)
}
function num(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new InvalidField(path)
  return value
}
function bool(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new InvalidField(path)
  return value
}
function withOptional<T extends object>(base: T, extra: Record<string, string | undefined>): T {
  for (const [key, value] of Object.entries(extra)) if (value !== undefined) (base as Obj)[key] = value
  return base
}

function toRoutineExercise(value: unknown, path: string): RoutineExercise {
  const o = obj(value, path)
  return withOptional(
    {
      id: str(o.id, `${path}.id`),
      name: str(o.name, `${path}.name`),
      targetSets: num(o.targetSets, `${path}.targetSets`),
      targetReps: num(o.targetReps, `${path}.targetReps`),
    },
    { notes: optStr(o.notes, `${path}.notes`) },
  )
}

function toRoutine(value: unknown, path: string): Routine {
  const o = obj(value, path)
  const routine: Routine = {
    id: str(o.id, `${path}.id`),
    name: str(o.name, `${path}.name`),
    exercises: arr(o.exercises, `${path}.exercises`).map((e, i) => toRoutineExercise(e, `${path}.exercises[${i}]`)),
    archived: bool(o.archived, `${path}.archived`),
    createdAt: str(o.createdAt, `${path}.createdAt`),
    updatedAt: str(o.updatedAt, `${path}.updatedAt`),
  }
  return withOptional(routine, { description: optStr(o.description, `${path}.description`) })
}

function toSet(value: unknown, path: string): SetLog {
  const o = obj(value, path)
  return { reps: num(o.reps, `${path}.reps`), weight: num(o.weight, `${path}.weight`), done: bool(o.done, `${path}.done`) }
}

function toExerciseLog(value: unknown, path: string): ExerciseLog {
  const o = obj(value, path)
  return {
    exerciseId: str(o.exerciseId, `${path}.exerciseId`),
    name: str(o.name, `${path}.name`),
    sets: arr(o.sets, `${path}.sets`).map((s, i) => toSet(s, `${path}.sets[${i}]`)),
  }
}

function toSession(value: unknown, path: string): Session {
  const o = obj(value, path)
  const session: Session = {
    id: str(o.id, `${path}.id`),
    routineId: str(o.routineId, `${path}.routineId`),
    routineName: str(o.routineName, `${path}.routineName`),
    startedAt: str(o.startedAt, `${path}.startedAt`),
    finishedAt: str(o.finishedAt, `${path}.finishedAt`),
    exercises: arr(o.exercises, `${path}.exercises`).map((e, i) => toExerciseLog(e, `${path}.exercises[${i}]`)),
  }
  return withOptional(session, { notes: optStr(o.notes, `${path}.notes`) })
}

/** Parses and validates a backup file. Never throws. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' }
  }
  if (typeof raw !== 'object' || raw === null || (raw as Obj).format !== BACKUP_FORMAT) {
    return { ok: false, error: 'Este archivo no es un backup de Workout Tracker.' }
  }
  let file = raw as Obj
  if (typeof file.version !== 'number' || file.version < 1) {
    return { ok: false, error: 'Este archivo no es un backup de Workout Tracker.' }
  }
  if (file.version > BACKUP_VERSION) {
    return {
      ok: false,
      error: 'Este backup se creó con una versión más nueva de la app. Actualiza la app e inténtalo de nuevo.',
    }
  }
  while ((file.version as number) < BACKUP_VERSION) file = migrations[file.version as number](file)

  try {
    return {
      ok: true,
      exportedAt: str(file.exportedAt, 'exportedAt'),
      data: {
        routines: arr(file.routines, 'routines').map((r, i) => toRoutine(r, `routines[${i}]`)),
        sessions: arr(file.sessions, 'sessions').map((s, i) => toSession(s, `sessions[${i}]`)),
      },
    }
  } catch (error) {
    if (error instanceof InvalidField) return { ok: false, error: `Datos inválidos en ${error.message}.` }
    throw error
  }
}

/** Combines two data sets by id: nothing is duplicated, and the newest version of a routine wins. */
export function mergeData(current: AppData, incoming: AppData): AppData {
  const routines = new Map(current.routines.map((r) => [r.id, r]))
  for (const routine of incoming.routines) {
    const existing = routines.get(routine.id)
    if (!existing || routine.updatedAt > existing.updatedAt) routines.set(routine.id, routine)
  }
  const sessions = new Map(current.sessions.map((s) => [s.id, s]))
  for (const session of incoming.sessions) if (!sessions.has(session.id)) sessions.set(session.id, session)
  return { routines: [...routines.values()], sessions: [...sessions.values()] }
}
