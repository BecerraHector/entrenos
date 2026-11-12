import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { createBackup } from '../domain/backup'
import { makeRoutine, makeSession } from '../domain/fixtures'
import { importBackup } from './backupService'
import { db, lastSessionFor, readAllData, saveRoutine, saveSession } from './db'

const backupOf = (routines = [makeRoutine()], sessions = [makeSession()]) =>
  JSON.stringify(createBackup({ routines, sessions }, new Date('2026-03-01T00:00:00.000Z')))

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('importBackup', () => {
  it('replace mode leaves exactly the backup contents', async () => {
    await saveRoutine(makeRoutine({ id: 'local', name: 'Local only' }))
    const result = await importBackup(backupOf(), 'replace')
    expect(result).toEqual({ ok: true, routines: 1, sessions: 1 })
    const data = await readAllData()
    expect(data.routines.map((r) => r.id)).toEqual(['r1'])
    expect(data.sessions.map((s) => s.id)).toEqual(['s1'])
  })

  it('merge mode keeps local data and adds the backup without duplicates', async () => {
    await saveRoutine(makeRoutine({ id: 'local', name: 'Local only' }))
    await saveSession(makeSession())
    const result = await importBackup(backupOf(), 'merge')
    expect(result).toEqual({ ok: true, routines: 2, sessions: 1 })
    const data = await readAllData()
    expect(data.routines.map((r) => r.id).sort()).toEqual(['local', 'r1'])
    expect(data.sessions).toHaveLength(1)
  })

  it('leaves the database untouched when the file is invalid', async () => {
    await saveRoutine(makeRoutine({ id: 'local' }))
    const before = await readAllData()
    const result = await importBackup('{"format":"something-else"}', 'replace')
    expect(result).toEqual({ ok: false, error: 'This file is not a Workout Tracker backup.' })
    expect(await readAllData()).toEqual(before)
  })
})

describe('lastSessionFor', () => {
  it('returns the most recently finished session of the routine', async () => {
    await saveSession(makeSession({ id: 'new', finishedAt: '2026-02-01T00:00:00.000Z' }))
    await saveSession(makeSession({ id: 'old', finishedAt: '2026-01-01T00:00:00.000Z' }))
    await saveSession(makeSession({ id: 'other', routineId: 'r2', finishedAt: '2026-03-01T00:00:00.000Z' }))
    expect((await lastSessionFor('r1'))?.id).toBe('new')
    expect(await lastSessionFor('missing')).toBeUndefined()
  })
})
