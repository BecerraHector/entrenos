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
      const name = draftRoutine?.name ?? 'otra rutina'
      if (!confirm(`Tienes un entrenamiento en curso de "${name}". ¿Descartarlo y empezar "${routine.name}"?`)) return
      await clearDraft()
    }
    go(`/workout/${routine.id}`)
  }

  const card = (routine: Routine) => (
    <li key={routine.id} className="card">
      <button className="card-main" onClick={() => go(`/routines/${routine.id}/edit`)}>
        <span className="card-title">{routine.name}</span>
        <span className="muted">
          {plural(routine.exercises.length, 'ejercicio')}
          {lastDone.has(routine.id) ? ` · último: ${formatDate(lastDone.get(routine.id)!)}` : ' · sin hacer todavía'}
        </span>
      </button>
      {!routine.archived && (
        <button className="btn primary" onClick={() => start(routine)}>
          {draft?.routineId === routine.id ? 'Continuar' : 'Empezar'}
        </button>
      )}
    </li>
  )

  return (
    <Screen
      title="Rutinas"
      action={
        <a className="btn small" href="#/routines/new">
          + Nueva
        </a>
      }
    >
      <BackupReminder />
      {draft && draftRoutine && (
        <a className="banner" href={`#/workout/${draft.routineId}`}>
          Entrenamiento en curso: <strong>{draftRoutine.name}</strong> — toca para continuar
        </a>
      )}
      {active.length === 0 ? (
        <EmptyState title="Todavía no hay rutinas">
          <p className="muted">Crea tu primera rutina para empezar a registrar tus entrenamientos.</p>
          <a className="btn primary" href="#/routines/new">
            Crear rutina
          </a>
        </EmptyState>
      ) : (
        <ul className="list">{active.map(card)}</ul>
      )}
      {archived.length > 0 && (
        <>
          <button className="link" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? 'Ocultar' : 'Mostrar'} archivadas ({archived.length})
          </button>
          {showArchived && <ul className="list">{archived.map(card)}</ul>}
        </>
      )}
    </Screen>
  )
}
