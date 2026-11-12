import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, deleteRoutine, saveRoutine } from '../../data/db'
import { createId, type Routine, type RoutineExercise } from '../../domain/model'
import { go } from '../../shared/router'
import { NumberInput, Screen } from '../../shared/ui'

const newExercise = (): RoutineExercise => ({ id: createId(), name: '', targetSets: 3, targetReps: 10 })

export function RoutineEditor({ id }: { id?: string }) {
  // `null` means "loaded, not found"; `undefined` means still loading.
  const existing = useLiveQuery(async () => (id ? ((await db.routines.get(id)) ?? null) : null), [id])
  if (existing === undefined) return null
  if (id && existing === null) {
    return (
      <Screen title="Rutina no encontrada" back="#/">
        <p className="muted">Esta rutina ya no existe.</p>
      </Screen>
    )
  }
  return <RoutineForm key={id ?? 'new'} existing={existing ?? undefined} />
}

function RoutineForm({ existing }: { existing?: Routine }) {
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [exercises, setExercises] = useState<RoutineExercise[]>(existing?.exercises ?? [newExercise()])
  const [error, setError] = useState('')

  const update = (index: number, patch: Partial<RoutineExercise>) =>
    setExercises(exercises.map((e, i) => (i === index ? { ...e, ...patch } : e)))

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= exercises.length) return
    const next = [...exercises]
    ;[next[index], next[target]] = [next[target], next[index]]
    setExercises(next)
  }

  async function save(archived = existing?.archived ?? false) {
    const cleaned = exercises
      .map((e) => ({ ...e, name: e.name.trim(), notes: e.notes?.trim() || undefined }))
      .filter((e) => e.name !== '')
    if (name.trim() === '') return setError('Ponle un nombre a la rutina.')
    if (cleaned.length === 0) return setError('Agrega al menos un ejercicio con nombre.')
    if (cleaned.some((e) => e.targetSets < 1)) return setError('Cada ejercicio necesita al menos 1 serie.')
    const now = new Date().toISOString()
    const routine: Routine = {
      id: existing?.id ?? createId(),
      name: name.trim(),
      exercises: cleaned,
      archived,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    if (description.trim()) routine.description = description.trim()
    await saveRoutine(routine)
    go('/')
  }

  async function remove() {
    if (!existing) return
    if (!confirm(`¿Eliminar "${existing.name}"? Tu historial de entrenamientos se conserva.`)) return
    await deleteRoutine(existing.id)
    go('/')
  }

  return (
    <Screen title={existing ? 'Editar rutina' : 'Nueva rutina'} back="#/">
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <label className="field">
          <span>Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Día de empuje" autoFocus={!existing} />
        </label>
        <label className="field">
          <span>Descripción (opcional)</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ej. Pecho, hombros, tríceps" />
        </label>

        <h2>Ejercicios</h2>
        <ol className="exercise-editor">
          {exercises.map((exercise, index) => (
            <li key={exercise.id} className="card column">
              <input
                aria-label={`Nombre del ejercicio ${index + 1}`}
                value={exercise.name}
                onChange={(e) => update(index, { name: e.target.value })}
                placeholder="Nombre del ejercicio"
              />
              <div className="row">
                <label className="inline-field">
                  <span>Series</span>
                  <NumberInput label="Series objetivo" value={exercise.targetSets} onChange={(v) => update(index, { targetSets: Math.round(v) })} />
                </label>
                <label className="inline-field">
                  <span>Reps</span>
                  <NumberInput label="Reps objetivo" value={exercise.targetReps} onChange={(v) => update(index, { targetReps: Math.round(v) })} />
                </label>
              </div>
              <input
                aria-label={`Notas del ejercicio ${index + 1}`}
                value={exercise.notes ?? ''}
                onChange={(e) => update(index, { notes: e.target.value })}
                placeholder="Notas (opcional)"
              />
              <div className="row end">
                <button type="button" className="btn small" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Subir">
                  ↑
                </button>
                <button type="button" className="btn small" onClick={() => move(index, 1)} disabled={index === exercises.length - 1} aria-label="Bajar">
                  ↓
                </button>
                <button type="button" className="btn small danger" onClick={() => setExercises(exercises.filter((_, i) => i !== index))}>
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="btn" onClick={() => setExercises([...exercises, newExercise()])}>
          + Agregar ejercicio
        </button>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn primary">
          Guardar rutina
        </button>
        {existing && (
          <>
            <button type="button" className="btn" onClick={() => save(!existing.archived)}>
              {existing.archived ? 'Desarchivar' : 'Archivar'}
            </button>
            <button type="button" className="btn danger" onClick={remove}>
              Eliminar rutina
            </button>
          </>
        )}
      </form>
    </Screen>
  )
}
