import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { dayKey, monthGrid } from '../../domain/calendar'
import { plural } from '../../shared/format'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const monthLabel = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })

interface MonthCalendarProps {
  /** Number of workouts per local day (`YYYY-MM-DD`). */
  workoutsByDay: Map<string, number>
  /** Days with at least one personal record. */
  recordDays: Set<string>
  selected: string | null
  onSelect: (day: string | null) => void
}

export function MonthCalendar({ workoutsByDay, recordDays, selected, onSelect }: MonthCalendarProps) {
  const [today] = useState(() => new Date())
  const [view, setView] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }))
  const todayKey = dayKey(today)
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth()

  const shift = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
    onSelect(null)
  }

  const weeks = monthGrid(view.year, view.month)
  const keyOf = (day: number) => dayKey(new Date(view.year, view.month, day))
  const monthTotal = weeks.flat().reduce<number>((n, day) => n + (day ? (workoutsByDay.get(keyOf(day)) ?? 0) : 0), 0)

  return (
    <section className="calendar card column">
      <div className="calendar-head">
        <button className="icon-btn" onClick={() => shift(-1)} aria-label="Mes anterior">
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="calendar-title">
          <strong>{monthLabel.format(new Date(view.year, view.month, 1))}</strong>
          <span className="muted small">{plural(monthTotal, 'entrenamiento')}</span>
        </div>
        <button className="icon-btn" onClick={() => shift(1)} disabled={isCurrentMonth} aria-label="Mes siguiente">
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="calendar-grid" key={`${view.year}-${view.month}`} role="grid">
        {WEEKDAYS.map((d) => (
          <span key={d} className="calendar-weekday" aria-hidden="true">
            {d}
          </span>
        ))}
        {weeks.flat().map((day, i) => {
          if (day === null) return <span key={`empty-${i}`} />
          const key = keyOf(day)
          const count = workoutsByDay.get(key) ?? 0
          const classes = ['calendar-day', count ? 'trained' : '', key === todayKey ? 'today' : '', key === selected ? 'selected' : '']
            .filter(Boolean)
            .join(' ')
          const style = { ['--i' as string]: i }
          if (!count) {
            return (
              <span key={key} className={classes} style={style}>
                {day}
              </span>
            )
          }
          return (
            <button
              key={key}
              className={classes}
              style={style}
              onClick={() => onSelect(key === selected ? null : key)}
              aria-pressed={key === selected}
              aria-label={`${day}: ${plural(count, 'entrenamiento')}${recordDays.has(key) ? ', con récord' : ''}`}
            >
              {day}
              {recordDays.has(key) && <span className="record-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
