import Dexie, { type EntityTable } from 'dexie'
import type { AppData } from '../domain/backup'
import type { ExerciseLog, Routine, Session } from '../domain/model'

interface MetaEntry {
  key: string
  value: string
}

/** In-progress workout, saved on every change so iOS closing the app never loses it. */
export interface WorkoutDraft {
  routineId: string
  startedAt: string
  exercises: ExerciseLog[]
  notes?: string
}

class AppDatabase extends Dexie {
  routines!: EntityTable<Routine, 'id'>
  sessions!: EntityTable<Session, 'id'>
  meta!: EntityTable<MetaEntry, 'key'>

  constructor() {
    super('workout-tracker')
    this.version(1).stores({
      routines: 'id, updatedAt',
      sessions: 'id, routineId, finishedAt',
      meta: 'key',
    })
  }
}

export const db = new AppDatabase()

const LAST_EXPORT_KEY = 'lastExportAt'
const DRAFT_KEY = 'workoutDraft'

export async function saveRoutine(routine: Routine): Promise<void> {
  await db.routines.put(routine)
}

/** Deletes the routine only; past sessions keep their own snapshot of names. */
export async function deleteRoutine(id: string): Promise<void> {
  await db.routines.delete(id)
}

export async function saveSession(session: Session): Promise<void> {
  await db.sessions.put(session)
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id)
}

export async function lastSessionFor(routineId: string): Promise<Session | undefined> {
  const sessions = await db.sessions.where('routineId').equals(routineId).sortBy('finishedAt')
  return sessions.at(-1)
}

export async function readAllData(): Promise<AppData> {
  const [routines, sessions] = await Promise.all([db.routines.toArray(), db.sessions.toArray()])
  return { routines, sessions }
}

/** Writes imported data atomically: either everything is stored or nothing changes. */
export async function writeAllData(data: AppData, mode: 'replace' | 'merge'): Promise<void> {
  await db.transaction('rw', db.routines, db.sessions, async () => {
    if (mode === 'replace') await Promise.all([db.routines.clear(), db.sessions.clear()])
    await db.routines.bulkPut(data.routines)
    await db.sessions.bulkPut(data.sessions)
  })
}

async function getMeta(key: string): Promise<string | undefined> {
  return (await db.meta.get(key))?.value
}

export const getLastExportAt = () => getMeta(LAST_EXPORT_KEY)

export async function setLastExportAt(iso: string): Promise<void> {
  await db.meta.put({ key: LAST_EXPORT_KEY, value: iso })
}

export async function getDraft(): Promise<WorkoutDraft | undefined> {
  const value = await getMeta(DRAFT_KEY)
  return value ? (JSON.parse(value) as WorkoutDraft) : undefined
}

export async function saveDraft(draft: WorkoutDraft): Promise<void> {
  await db.meta.put({ key: DRAFT_KEY, value: JSON.stringify(draft) })
}

export async function clearDraft(): Promise<void> {
  await db.meta.delete(DRAFT_KEY)
}
