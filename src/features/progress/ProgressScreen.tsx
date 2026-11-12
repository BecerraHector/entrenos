import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../data/db'
import { exerciseProgress, trackedExercises, type ProgressPoint } from '../../domain/progress'
import { formatDate, formatNumber, plural } from '../../shared/format'
import { EmptyState, Screen } from '../../shared/ui'
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
        <EmptyState title="Todavía no hay datos">
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
    <Screen title="Progreso">
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
        <Stat label="Último" value={`${formatNumber(latest[metric])} ${unit}`} />
        <Stat label="Mejor" value={`${formatNumber(Math.max(...points.map((p) => p[metric])))} ${unit}`} />
        <Stat label="Cambio" value={`${change > 0 ? '+' : ''}${formatNumber(change)} ${unit}`} />
      </div>

      <div className="card">
        <LineChart points={points.map((p) => ({ date: p.date, value: p[metric] }))} unit={unit} />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="muted small">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
