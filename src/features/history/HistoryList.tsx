import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarDays, Trophy } from 'lucide-react'
import { db } from '../../data/db'
import { detectRecords } from '../../domain/achievements'
import { sessionStats } from '../../domain/progress'
import { formatDayMonth, formatDuration, formatNumber, plural } from '../../shared/format'
import { go } from '../../shared/router'
import { EmptyState, Screen } from '../../shared/ui'

export function HistoryList() {
  const sessions = useLiveQuery(() => db.sessions.orderBy('finishedAt').reverse().toArray())
  if (!sessions) return null

  return (
    <Screen eyebrow="Tu camino" title="Historial">
      {sessions.length === 0 ? (
        <EmptyState title="Todavía no hay entrenamientos" icon={<CalendarDays size={40} strokeWidth={2} />}>
          <p className="muted">Los entrenamientos terminados aparecerán aquí.</p>
        </EmptyState>
      ) : (
        <ul className="list">
          {sessions.map((session, index) => {
            const stats = sessionStats(session)
            const records = detectRecords(session, sessions).length
            const { day, month } = formatDayMonth(session.finishedAt)
            return (
              <li key={session.id} className="card stagger" style={{ ['--i' as string]: Math.min(index, 10) }}>
                <button className="card-main row" onClick={() => go(`/history/${session.id}`)}>
                  <span className="date-badge" aria-hidden="true">
                    <strong>{day}</strong>
                    <span>{month}</span>
                  </span>
                  <span className="column grow">
                    <span className="card-title">{session.routineName}</span>
                    <span className="muted small">
                      {formatDuration(session)} · {plural(stats.sets, 'serie')}
                      {stats.volume > 0 ? ` · ${formatNumber(stats.volume)} kg` : ''}
                    </span>
                  </span>
                  {records > 0 && (
                    <span className="pr-badge" aria-label={plural(records, 'récord')}>
                      <Trophy size={14} strokeWidth={2.5} aria-hidden="true" />
                      {records}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Screen>
  )
}
