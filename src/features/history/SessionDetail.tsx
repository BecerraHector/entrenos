import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteSession } from '../../data/db'
import { formatDate, formatDuration, formatNumber, formatSet, plural } from '../../shared/format'
import { go } from '../../shared/router'
import { Screen } from '../../shared/ui'
import { sessionStats } from '../../domain/progress'

export function SessionDetail({ id }: { id: string }) {
  const session = useLiveQuery(async () => (await db.sessions.get(id)) ?? null, [id])
  if (session === undefined) return null
  if (session === null) {
    return (
      <Screen title="Entrenamiento no encontrado" back="#/history">
        <p className="muted">Este entrenamiento ya no existe.</p>
      </Screen>
    )
  }

  const stats = sessionStats(session)

  async function remove() {
    if (!confirm('¿Eliminar este entrenamiento del historial? No se puede deshacer.')) return
    await deleteSession(id)
    go('/history')
  }

  return (
    <Screen title={session.routineName} back="#/history">
      <p className="muted">
        {formatDate(session.finishedAt)} · {formatDuration(session)} · {plural(stats.sets, 'serie')}
        {stats.volume > 0 ? ` · ${formatNumber(stats.volume)} kg de volumen` : ''}
      </p>
      {session.exercises.map((exercise) => (
        <section key={exercise.exerciseId} className="card column">
          <h2>{exercise.name}</h2>
          <ol className="set-list">
            {exercise.sets.map((set, i) => (
              <li key={i} className={set.done ? '' : 'skipped'}>
                {formatSet(set.reps, set.weight)}
                {set.done ? '' : ' (omitida)'}
              </li>
            ))}
          </ol>
        </section>
      ))}
      {session.notes && (
        <section className="card column">
          <h2>Notas</h2>
          <p>{session.notes}</p>
        </section>
      )}
      <button className="btn danger" onClick={remove}>
        Eliminar entrenamiento
      </button>
    </Screen>
  )
}
