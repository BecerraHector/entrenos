import { mergeData, parseBackup, type AppData } from '../domain/backup'
import { readAllData, writeAllData } from './db'

export type ImportMode = 'replace' | 'merge'

export type ImportResult =
  | { ok: true; routines: number; sessions: number }
  | { ok: false; error: string }

/** Validates the file first; the database is only touched when the whole backup is valid. */
export async function importBackup(text: string, mode: ImportMode): Promise<ImportResult> {
  const parsed = parseBackup(text)
  if (!parsed.ok) return parsed
  const data: AppData = mode === 'merge' ? mergeData(await readAllData(), parsed.data) : parsed.data
  await writeAllData(data, mode)
  return { ok: true, routines: data.routines.length, sessions: data.sessions.length }
}
