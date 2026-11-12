import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db'
import { sessionStats } from '../../domain/progress'
import { formatDate, formatDuration, formatNumber, plural } from '../../shared/format'
import { go } from '../../shared/router'
import { EmptyState, Screen } from '../../shared/ui'

export function HistoryList() {
  const sessions = useLiveQuery(() => db.sessions.orderBy('finishedAt').reverse().toArray())
  if (!sessions) return null

  return (
    <Screen title="History">
      {sessions.length === 0 ? (
        <EmptyState title="No workouts yet">
          <p className="muted">Finished workouts will show up here.</p>
        </EmptyState>
      ) : (
        <ul className="list">
          {sessions.map((session) => {
            const stats = sessionStats(session)
            return (
              <li key={session.id} className="card">
                <button className="card-main" onClick={() => go(`/history/${session.id}`)}>
                  <span className="card-title">{session.routineName}</span>
                  <span className="muted">
                    {formatDate(session.finishedAt)} · {formatDuration(session)}
                  </span>
                  <span className="muted small">
                    {plural(stats.sets, 'set')}{stats.volume > 0 ? ` · ${formatNumber(stats.volume)} kg volume` : ''}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Screen>
  )
}
