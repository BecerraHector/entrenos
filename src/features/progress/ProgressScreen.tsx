import { useLiveQuery } from 'dexie-react-hooks'
import { TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { db } from '../../data/db'
import { exerciseProgress, trackedExercises, type ProgressPoint } from '../../domain/progress'
import { formatDate, formatNumber, plural } from '../../shared/format'
import { CountUp, EmptyState, Screen } from '../../shared/ui'
import { LineChart } from './LineChart'

type Metric = 'bestWeight' | 'bestReps' | 'volume'

const METRICS: Record<Metric, { label: string; unit: string }> = {
  bestWeight: { label: 'Mejor peso', unit: 'kg' },
  bestReps: { label: 'Mejores reps', unit: 'reps' },
  volume: { label: 'Volumen', unit: 'kg' },
}

export function ProgressScreen() {
  const sessions = useLiveQuery(() => db.sessions.toArray())
  const [selected, setSelected] = useState('')
  const [chosenMetric, setMetric] = useState<Metric | undefined>(undefined)
  if (!sessions) return null

  const exercises = trackedExercises(sessions)
  if (exercises.length === 0) {
    return (
      <Screen title="Progreso">
        <EmptyState title="Todavía no hay datos" icon={<TrendingUp size={40} strokeWidth={2} />}>
          <p className="muted">Completa un entrenamiento y aquí verás tu progreso por ejercicio.</p>
        </EmptyState>
      </Screen>
    )
  }

  const exercise = exercises.includes(selected) ? selected : exercises[0]
  const points = exerciseProgress(sessions, exercise)
  const hasWeight = points.some((p) => p.bestWeight > 0)
  const metric: Metric = chosenMetric ?? (hasWeight ? 'bestWeight' : 'bestReps')
  const { unit } = METRICS[metric]
  const first = points[0]
  const latest = points[points.length - 1]
  const change = latest[metric] - first[metric]

  return (
    <Screen eyebrow="Más fuerte cada día" title="Progreso">
      <label className="field">
        <span>Ejercicio</span>
        <select value={exercise} onChange={(e) => setSelected(e.target.value)}>
          {exercises.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      <div className="segmented" role="tablist">
        {(Object.keys(METRICS) as Metric[]).map((m) => (
          <button key={m} role="tab" aria-selected={m === metric} className={m === metric ? 'on' : ''} onClick={() => setMetric(m)}>
            {METRICS[m].label}
          </button>
        ))}
      </div>

      <div className="stats">
        <Stat label="Último" value={latest[metric]} unit={unit} />
        <Stat label="Mejor" value={Math.max(...points.map((p) => p[metric]))} unit={unit} />
        <Stat label="Cambio" value={change} unit={unit} signed />
      </div>

      <div className="card chart-card">
        <LineChart key={`${exercise}-${metric}`} points={points.map((p) => ({ date: p.date, value: p[metric] }))} unit={unit} />
      </div>

      <h2>Sesiones ({points.length})</h2>
      <ul className="list compact">
        {[...points].reverse().map((p: ProgressPoint) => (
          <li key={p.date} className="row between">
            <span>{formatDate(p.date)}</span>
            <span className="muted">
              {plural(p.sets, 'serie')} · {formatNumber(p[metric])} {unit}
            </span>
          </li>
        ))}
      </ul>
    </Screen>
  )
}

function Stat({ label, value, unit, signed = false }: { label: string; value: number; unit: string; signed?: boolean }) {
  const tone = signed && value > 0 ? ' up' : signed && value < 0 ? ' down' : ''
  return (
    <div className={`stat${tone}`}>
      <span className="stat-label">{label}</span>
      <strong>
        {signed && value > 0 ? '+' : signed && value < 0 ? '−' : ''}
        <CountUp key={value} value={Math.abs(value)} />
        <small> {unit}</small>
      </strong>
    </div>
  )
}
