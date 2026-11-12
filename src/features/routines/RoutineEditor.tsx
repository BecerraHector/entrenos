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
      <Screen title="Routine not found" back="#/">
        <p className="muted">This routine no longer exists.</p>
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
    if (name.trim() === '') return setError('Give the routine a name.')
    if (cleaned.length === 0) return setError('Add at least one exercise with a name.')
    if (cleaned.some((e) => e.targetSets < 1)) return setError('Every exercise needs at least 1 set.')
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
    if (!confirm(`Delete "${existing.name}"? Your workout history for it is kept.`)) return
    await deleteRoutine(existing.id)
    go('/')
  }

  return (
    <Screen title={existing ? 'Edit routine' : 'New routine'} back="#/">
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Push day" autoFocus={!existing} />
        </label>
        <label className="field">
          <span>Description (optional)</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Chest, shoulders, triceps" />
        </label>

        <h2>Exercises</h2>
        <ol className="exercise-editor">
          {exercises.map((exercise, index) => (
            <li key={exercise.id} className="card column">
              <input
                aria-label={`Exercise ${index + 1} name`}
                value={exercise.name}
                onChange={(e) => update(index, { name: e.target.value })}
                placeholder="Exercise name"
              />
              <div className="row">
                <label className="inline-field">
                  <span>Sets</span>
                  <NumberInput label="Target sets" value={exercise.targetSets} onChange={(v) => update(index, { targetSets: Math.round(v) })} />
                </label>
                <label className="inline-field">
                  <span>Reps</span>
                  <NumberInput label="Target reps" value={exercise.targetReps} onChange={(v) => update(index, { targetReps: Math.round(v) })} />
                </label>
              </div>
              <input
                aria-label={`Exercise ${index + 1} notes`}
                value={exercise.notes ?? ''}
                onChange={(e) => update(index, { notes: e.target.value })}
                placeholder="Notes (optional)"
              />
              <div className="row end">
                <button type="button" className="btn small" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
                  ↑
                </button>
                <button type="button" className="btn small" onClick={() => move(index, 1)} disabled={index === exercises.length - 1} aria-label="Move down">
                  ↓
                </button>
                <button type="button" className="btn small danger" onClick={() => setExercises(exercises.filter((_, i) => i !== index))}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="btn" onClick={() => setExercises([...exercises, newExercise()])}>
          + Add exercise
        </button>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn primary">
          Save routine
        </button>
        {existing && (
          <>
            <button type="button" className="btn" onClick={() => save(!existing.archived)}>
              {existing.archived ? 'Unarchive' : 'Archive'}
            </button>
            <button type="button" className="btn danger" onClick={remove}>
              Delete routine
            </button>
          </>
        )}
      </form>
    </Screen>
  )
}
