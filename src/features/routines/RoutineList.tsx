import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { clearDraft, db, getDraft } from '../../data/db'
import type { Routine } from '../../domain/model'
import { formatDate, plural } from '../../shared/format'
import { go } from '../../shared/router'
import { EmptyState, Screen } from '../../shared/ui'
import { BackupReminder } from '../backup/BackupReminder'

export function RoutineList() {
  const routines = useLiveQuery(() => db.routines.toArray())
  const sessions = useLiveQuery(() => db.sessions.toArray())
  const draft = useLiveQuery(() => getDraft())
  const [showArchived, setShowArchived] = useState(false)

  if (!routines || !sessions) return null

  const lastDone = new Map<string, string>()
  for (const s of sessions) {
    const prev = lastDone.get(s.routineId)
    if (!prev || s.finishedAt > prev) lastDone.set(s.routineId, s.finishedAt)
  }
  const byName = (a: Routine, b: Routine) => a.name.localeCompare(b.name)
  const active = routines.filter((r) => !r.archived).sort(byName)
  const archived = routines.filter((r) => r.archived).sort(byName)
  const draftRoutine = draft ? routines.find((r) => r.id === draft.routineId) : undefined

  async function start(routine: Routine) {
    if (draft && draft.routineId !== routine.id) {
      const name = draftRoutine?.name ?? 'another routine'
      if (!confirm(`You have a workout in progress for "${name}". Discard it and start "${routine.name}"?`)) return
      await clearDraft()
    }
    go(`/workout/${routine.id}`)
  }

  const card = (routine: Routine) => (
    <li key={routine.id} className="card">
      <button className="card-main" onClick={() => go(`/routines/${routine.id}/edit`)}>
        <span className="card-title">{routine.name}</span>
        <span className="muted">
          {plural(routine.exercises.length, 'exercise')}
          {lastDone.has(routine.id) ? ` · last done ${formatDate(lastDone.get(routine.id)!)}` : ' · not done yet'}
        </span>
      </button>
      {!routine.archived && (
        <button className="btn primary" onClick={() => start(routine)}>
          {draft?.routineId === routine.id ? 'Resume' : 'Start'}
        </button>
      )}
    </li>
  )

  return (
    <Screen
      title="Routines"
      action={
        <a className="btn small" href="#/routines/new">
          + New
        </a>
      }
    >
      <BackupReminder />
      {draft && draftRoutine && (
        <a className="banner" href={`#/workout/${draft.routineId}`}>
          Workout in progress: <strong>{draftRoutine.name}</strong> — tap to resume
        </a>
      )}
      {active.length === 0 ? (
        <EmptyState title="No routines yet">
          <p className="muted">Create your first routine to start tracking your workouts.</p>
          <a className="btn primary" href="#/routines/new">
            Create routine
          </a>
        </EmptyState>
      ) : (
        <ul className="list">{active.map(card)}</ul>
      )}
      {archived.length > 0 && (
        <>
          <button className="link" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
          </button>
          {showArchived && <ul className="list">{archived.map(card)}</ul>}
        </>
      )}
    </Screen>
  )
}
