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
      <Screen title="Workout not found" back="#/history">
        <p className="muted">This workout no longer exists.</p>
      </Screen>
    )
  }

  const stats = sessionStats(session)

  async function remove() {
    if (!confirm('Delete this workout from your history? This cannot be undone.')) return
    await deleteSession(id)
    go('/history')
  }

  return (
    <Screen title={session.routineName} back="#/history">
      <p className="muted">
        {formatDate(session.finishedAt)} · {formatDuration(session)} · {plural(stats.sets, 'set')}
        {stats.volume > 0 ? ` · ${formatNumber(stats.volume)} kg volume` : ''}
      </p>
      {session.exercises.map((exercise) => (
        <section key={exercise.exerciseId} className="card column">
          <h2>{exercise.name}</h2>
          <ol className="set-list">
            {exercise.sets.map((set, i) => (
              <li key={i} className={set.done ? '' : 'skipped'}>
                {formatSet(set.reps, set.weight)}
                {set.done ? '' : ' (skipped)'}
              </li>
            ))}
          </ol>
        </section>
      ))}
      {session.notes && (
        <section className="card column">
          <h2>Notes</h2>
          <p>{session.notes}</p>
        </section>
      )}
      <button className="btn danger" onClick={remove}>
        Delete workout
      </button>
    </Screen>
  )
}
