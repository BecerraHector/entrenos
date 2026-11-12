import { useLiveQuery } from 'dexie-react-hooks'
import { Dumbbell, Flame, Play, Plus, RotateCcw, Zap } from 'lucide-react'
import { useState } from 'react'
import { clearDraft, db, getDraft } from '../../data/db'
import { sessionsThisWeek, weeklyStreak } from '../../domain/achievements'
import type { Routine } from '../../domain/model'
import { formatDate, plural } from '../../shared/format'
import { go } from '../../shared/router'
import { CountUp, EmptyState, Screen } from '../../shared/ui'
import { BackupReminder } from '../backup/BackupReminder'
import { StorageWarning } from '../backup/StorageWarning'

export function RoutineList() {
  const routines = useLiveQuery(() => db.routines.toArray())
  const sessions = useLiveQuery(() => db.sessions.toArray())
  const draft = useLiveQuery(() => getDraft())
  // Computed inside the query (not during render) so "now" stays stable between renders.
  const week = useLiveQuery(async () => {
    const all = await db.sessions.toArray()
    const now = new Date()
    return { streak: weeklyStreak(all, now), thisWeek: sessionsThisWeek(all, now) }
  })
  const [showArchived, setShowArchived] = useState(false)

  if (!routines || !sessions || !week) return null

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

  const card = (routine: Routine, index: number) => {
    const resuming = draft?.routineId === routine.id
    return (
      <li key={routine.id} className="card routine-card stagger" style={{ ['--i' as string]: index }}>
        <button className="card-main" onClick={() => go(`/routines/${routine.id}/edit`)}>
          <span className="card-title">{routine.name}</span>
          <span className="muted small">
            {plural(routine.exercises.length, 'ejercicio')}
            {lastDone.has(routine.id) ? ` · último: ${formatDate(lastDone.get(routine.id)!)}` : ' · sin hacer todavía'}
          </span>
        </button>
        {!routine.archived && (
          <button className="play-btn" onClick={() => start(routine)} aria-label={`${resuming ? 'Continuar' : 'Empezar'} ${routine.name}`}>
            {resuming ? <RotateCcw size={22} strokeWidth={2.5} /> : <Play size={22} strokeWidth={2.5} fill="currentColor" />}
          </button>
        )}
      </li>
    )
  }

  return (
    <Screen
      eyebrow="A entrenar"
      title="Rutinas"
      action={
        <a className="icon-btn primary" href="#/routines/new" aria-label="Nueva rutina">
          <Plus size={24} strokeWidth={2.75} />
        </a>
      }
    >
      <section className="hero stagger" style={{ ['--i' as string]: 0 }}>
        <div className="hero-stat">
          <Flame className={week.streak > 0 ? 'flame lit' : 'flame'} size={34} strokeWidth={2.25} aria-hidden="true" />
          <div>
            <strong className="hero-number">
              <CountUp value={week.streak} />
            </strong>
            <span className="hero-label">{week.streak === 1 ? 'semana seguida' : 'semanas seguidas'}</span>
          </div>
        </div>
        <div className="hero-divider" />
        <div className="hero-stat">
          <Zap className="zap" size={30} strokeWidth={2.25} aria-hidden="true" />
          <div>
            <strong className="hero-number">
              <CountUp value={week.thisWeek} />
            </strong>
            <span className="hero-label">esta semana</span>
          </div>
        </div>
      </section>

      <StorageWarning />
      <BackupReminder />
      {draft && draftRoutine && (
        <a className="banner live" href={`#/workout/${draft.routineId}`}>
          <span className="live-dot" aria-hidden="true" />
          <span>
            En curso: <strong>{draftRoutine.name}</strong> — toca para continuar
          </span>
        </a>
      )}

      {active.length === 0 ? (
        <EmptyState title="Todavía no hay rutinas" icon={<Dumbbell size={40} strokeWidth={2} />}>
          <p className="muted">Crea tu primera rutina para empezar a registrar tus entrenamientos.</p>
          <a className="btn primary" href="#/routines/new">
            Crear rutina
          </a>
        </EmptyState>
      ) : (
        <ul className="list">{active.map((r, i) => card(r, i + 1))}</ul>
      )}
      {archived.length > 0 && (
        <>
          <button className="link" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? 'Ocultar' : 'Mostrar'} archivadas ({archived.length})
          </button>
          {showArchived && <ul className="list">{archived.map((r, i) => card(r, i))}</ul>}
        </>
      )}
    </Screen>
  )
}
