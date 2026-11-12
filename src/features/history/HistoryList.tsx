import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarDays, Trophy, X } from 'lucide-react'
import { useState } from 'react'
import { db } from '../../data/db'
import { detectRecords } from '../../domain/achievements'
import { dayKey, groupByDay } from '../../domain/calendar'
import { sessionStats } from '../../domain/progress'
import { formatDate, formatDayMonth, formatDuration, formatNumber, plural } from '../../shared/format'
import { go } from '../../shared/router'
import { EmptyState, Screen } from '../../shared/ui'
import { MonthCalendar } from './MonthCalendar'

export function HistoryList() {
  const sessions = useLiveQuery(() => db.sessions.orderBy('finishedAt').reverse().toArray())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  if (!sessions) return null

  const recordCounts = new Map(sessions.map((s) => [s.id, detectRecords(s, sessions).length]))
  const byDay = groupByDay(sessions)
  const workoutsByDay = new Map([...byDay].map(([day, list]) => [day, list.length]))
  const recordDays = new Set(sessions.filter((s) => recordCounts.get(s.id)).map((s) => dayKey(new Date(s.finishedAt))))
  const shown = selectedDay ? (byDay.get(selectedDay) ?? []) : sessions

  return (
    <Screen eyebrow="Tu camino" title="Historial">
      {sessions.length === 0 ? (
        <EmptyState title="Todavía no hay entrenamientos" icon={<CalendarDays size={40} strokeWidth={2} />}>
          <p className="muted">Los entrenamientos terminados aparecerán aquí.</p>
        </EmptyState>
      ) : (
        <>
          <MonthCalendar workoutsByDay={workoutsByDay} recordDays={recordDays} selected={selectedDay} onSelect={setSelectedDay} />
          {selectedDay && (
            <div className="filter-chip-row">
              <span className="filter-chip">
                {formatDate(shown[0]?.finishedAt ?? new Date(`${selectedDay}T12:00:00`).toISOString())}
                <button onClick={() => setSelectedDay(null)} aria-label="Ver todos los entrenamientos">
                  <X size={16} strokeWidth={2.75} />
                </button>
              </span>
            </div>
          )}
          <ul className="list" key={selectedDay ?? 'all'}>
            {shown.map((session, index) => {
              const stats = sessionStats(session)
              const records = recordCounts.get(session.id) ?? 0
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
        </>
      )}
    </Screen>
  )
}
