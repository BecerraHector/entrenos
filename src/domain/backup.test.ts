import { describe, expect, it } from 'vitest'
import { BACKUP_FORMAT, BACKUP_VERSION, createBackup, mergeData, parseBackup } from './backup'
import { makeRoutine, makeSession } from './fixtures'

const NOW = new Date('2026-03-01T12:00:00.000Z')

describe('createBackup', () => {
  it('wraps all data with format, version and export date', () => {
    const routines = [makeRoutine()]
    const sessions = [makeSession()]
    const file = createBackup({ routines, sessions }, NOW)
    expect(file).toEqual({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: NOW.toISOString(),
      routines,
      sessions,
    })
  })
})

describe('parseBackup', () => {
  it('round-trips an exported backup', () => {
    const data = { routines: [makeRoutine()], sessions: [makeSession()] }
    const result = parseBackup(JSON.stringify(createBackup(data, NOW)))
    expect(result).toEqual({ ok: true, data, exportedAt: NOW.toISOString() })
  })

  it('rejects text that is not JSON', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, error: 'The file is not valid JSON.' })
  })

  it('rejects JSON that is not a backup of this app', () => {
    expect(parseBackup('{"hello":1}')).toEqual({
      ok: false,
      error: 'This file is not a Workout Tracker backup.',
    })
  })

  it('rejects backups from a newer app version', () => {
    const file = { ...createBackup({ routines: [], sessions: [] }, NOW), version: BACKUP_VERSION + 1 }
    expect(parseBackup(JSON.stringify(file))).toEqual({
      ok: false,
      error: 'This backup was created by a newer version of the app. Update the app and try again.',
    })
  })

  it('rejects a backup with a malformed routine and says where', () => {
    const file = createBackup({ routines: [makeRoutine()], sessions: [] }, NOW)
    const broken = { ...file, routines: [{ ...file.routines[0], exercises: 'nope' }] }
    expect(parseBackup(JSON.stringify(broken))).toEqual({
      ok: false,
      error: 'Invalid data in routines[0].exercises.',
    })
  })

  it('rejects a backup with a malformed set and says where', () => {
    const session = makeSession()
    session.exercises[0].sets[1] = { reps: 'eight', weight: 60, done: true } as never
    const file = createBackup({ routines: [], sessions: [session] }, NOW)
    expect(parseBackup(JSON.stringify(file))).toEqual({
      ok: false,
      error: 'Invalid data in sessions[0].exercises[0].sets[1].reps.',
    })
  })
})

describe('mergeData', () => {
  it('adds new records without duplicating existing ones', () => {
    const current = { routines: [makeRoutine()], sessions: [makeSession()] }
    const incoming = {
      routines: [makeRoutine(), makeRoutine({ id: 'r2', name: 'Pull day' })],
      sessions: [makeSession(), makeSession({ id: 's2' })],
    }
    const merged = mergeData(current, incoming)
    expect(merged.routines.map((r) => r.id)).toEqual(['r1', 'r2'])
    expect(merged.sessions.map((s) => s.id)).toEqual(['s1', 's2'])
  })

  it('keeps the most recently updated version of a routine', () => {
    const older = makeRoutine({ name: 'Old name', updatedAt: '2026-01-01T00:00:00.000Z' })
    const newer = makeRoutine({ name: 'New name', updatedAt: '2026-02-01T00:00:00.000Z' })
    expect(mergeData({ routines: [older], sessions: [] }, { routines: [newer], sessions: [] }).routines).toEqual([newer])
    expect(mergeData({ routines: [newer], sessions: [] }, { routines: [older], sessions: [] }).routines).toEqual([newer])
  })
})
