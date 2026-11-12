import { useEffect, useState } from 'react'
import { clearDraft, db, getDraft, lastSessionFor, saveDraft, saveSession, type WorkoutDraft } from '../../data/db'
import { createId, type ExerciseLog, type Routine, type Session, type SetLog } from '../../domain/model'
import { buildSessionDraft } from '../../domain/session'
import { formatDate, formatSet } from '../../shared/format'
import { go } from '../../shared/router'
import { NumberInput, Screen } from '../../shared/ui'

interface Loaded {
  routine: Routine
  previous?: Session
  draft: WorkoutDraft
}

export function WorkoutScreen({ routineId }: { routineId: string }) {
  const [state, setState] = useState<Loaded | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const routine = await db.routines.get(routineId)
      if (!routine) return !cancelled && setState(null)
      const previous = await lastSessionFor(routineId)
      const saved = await getDraft()
      const draft: WorkoutDraft =
        saved?.routineId === routineId
          ? saved
          : { routineId, startedAt: new Date().toISOString(), exercises: buildSessionDraft(routine, previous) }
      await saveDraft(draft)
      if (!cancelled) setState({ routine, previous, draft })
    })()
    return () => {
      cancelled = true
    }
  }, [routineId])

  if (state === undefined) return null
  if (state === null) {
    return (
      <Screen title="Rutina no encontrada" back="#/">
        <p className="muted">Esta rutina ya no existe.</p>
      </Screen>
    )
  }
  return <ActiveWorkout {...state} />
}

function ActiveWorkout({ routine, previous, draft: initial }: Loaded) {
  const [draft, setDraft] = useState(initial)

  const commit = (next: WorkoutDraft) => {
    setDraft(next)
    void saveDraft(next)
  }

  const updateExercise = (index: number, change: (exercise: ExerciseLog) => ExerciseLog) =>
    commit({ ...draft, exercises: draft.exercises.map((e, i) => (i === index ? change(e) : e)) })

  const updateSet = (exerciseIndex: number, setIndex: number, patch: Partial<SetLog>) =>
    updateExercise(exerciseIndex, (e) => ({ ...e, sets: e.sets.map((s, i) => (i === setIndex ? { ...s, ...patch } : s)) }))

  const doneSets = draft.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
  const totalSets = draft.exercises.reduce((n, e) => n + e.sets.length, 0)

  async function finish() {
    if (doneSets === 0 && !confirm('No hay series marcadas como hechas. ¿Guardar el entrenamiento de todos modos?')) return
    const session: Session = {
      id: createId(),
      routineId: routine.id,
      routineName: routine.name,
      startedAt: draft.startedAt,
      finishedAt: new Date().toISOString(),
      exercises: draft.exercises,
    }
    if (draft.notes?.trim()) session.notes = draft.notes.trim()
    await saveSession(session)
    await clearDraft()
    go(`/history/${session.id}`)
  }

  async function discard() {
    if (!confirm('¿Descartar este entrenamiento? No se guardará nada.')) return
    await clearDraft()
    go('/')
  }

  return (
    <Screen title={routine.name} back="#/">
      <p className="muted">
        Iniciado el {formatDate(draft.startedAt)} · {doneSets}/{totalSets} series hechas
      </p>
      {draft.exercises.map((exercise, ei) => {
        const last = previous?.exercises.find((e) => e.exerciseId === exercise.exerciseId)
        const notes = routine.exercises.find((e) => e.id === exercise.exerciseId)?.notes
        return (
          <section key={exercise.exerciseId} className="card column">
            <h2>{exercise.name}</h2>
            {notes && <p className="muted">{notes}</p>}
            {last && <p className="muted small">La última vez: {last.sets.filter((s) => s.done).map((s) => formatSet(s.reps, s.weight)).join(', ') || '—'}</p>}
            <div className="set-grid">
              <span className="set-head">Serie</span>
              <span className="set-head">Reps</span>
              <span className="set-head">kg</span>
              <span className="set-head">Hecha</span>
              {exercise.sets.map((set, si) => (
                <div key={si} className={`set-row${set.done ? ' done' : ''}`}>
                  <span className="set-number">{si + 1}</span>
                  <NumberInput label={`${exercise.name} serie ${si + 1} reps`} value={set.reps} onChange={(reps) => updateSet(ei, si, { reps: Math.round(reps) })} />
                  <NumberInput label={`${exercise.name} serie ${si + 1} peso`} decimal value={set.weight} onChange={(weight) => updateSet(ei, si, { weight })} />
                  <button
                    className={`check${set.done ? ' on' : ''}`}
                    aria-label={`Marcar serie ${si + 1} como hecha`}
                    aria-pressed={set.done}
                    onClick={() => updateSet(ei, si, { done: !set.done })}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
            <div className="row end">
              <button
                className="btn small"
                disabled={exercise.sets.length <= 1}
                onClick={() => updateExercise(ei, (e) => ({ ...e, sets: e.sets.slice(0, -1) }))}
              >
                − Serie
              </button>
              <button
                className="btn small"
                onClick={() => updateExercise(ei, (e) => ({ ...e, sets: [...e.sets, { ...(e.sets.at(-1) ?? { reps: 0, weight: 0 }), done: false }] }))}
              >
                + Serie
              </button>
            </div>
          </section>
        )
      })}
      <label className="field">
        <span>Notas (opcional)</span>
        <textarea rows={3} value={draft.notes ?? ''} onChange={(e) => commit({ ...draft, notes: e.target.value })} placeholder="¿Cómo te sentiste?" />
      </label>
      <button className="btn primary" onClick={finish}>
        Terminar entrenamiento
      </button>
      <button className="btn danger" onClick={discard}>
        Descartar entrenamiento
      </button>
    </Screen>
  )
}
