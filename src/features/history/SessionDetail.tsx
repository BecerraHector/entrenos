import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Trash2, Trophy } from 'lucide-react'
import { db, deleteSession } from '../../data/db'
import { detectRecords, type PersonalRecord } from '../../domain/achievements'
import { sessionStats } from '../../domain/progress'
import { durationMinutes, formatDate, formatNumber, formatSet } from '../../shared/format'
import { go } from '../../shared/router'
import { Confetti, CountUp, Screen } from '../../shared/ui'

const recordText = (r: PersonalRecord) =>
  r.kind === 'weight'
    ? `${formatNumber(r.value)} kg (antes ${formatNumber(r.previous)} kg)`
    : `${r.value} reps (antes ${r.previous})`

export function SessionDetail({ id, celebrate }: { id: string; celebrate: boolean }) {
  const data = useLiveQuery(async () => {
    const session = await db.sessions.get(id)
    if (!session) return null
    return { session, records: detectRecords(session, await db.sessions.toArray()) }
  }, [id])
  if (data === undefined) return null
  if (data === null) {
    return (
      <Screen title="Entrenamiento no encontrado" back="#/history">
        <p className="muted">Este entrenamiento ya no existe.</p>
      </Screen>
    )
  }

  const { session, records } = data
  const stats = sessionStats(session)

  async function remove() {
    if (!confirm('¿Eliminar este entrenamiento del historial? No se puede deshacer.')) return
    await deleteSession(id)
    go('/history')
  }

  return (
    <Screen eyebrow={formatDate(session.finishedAt)} title={session.routineName} back="#/history">
      {celebrate && (
        <section className="celebration">
          <Confetti />
          <p className="celebration-kicker">{records.length > 0 ? '¡Nuevo récord!' : '¡Bien hecho!'}</p>
          <p className="celebration-title">Entrenamiento completado</p>
        </section>
      )}

      <div className="stats">
        <div className="stat stagger" style={{ ['--i' as string]: 1 }}>
          <span className="stat-label">Minutos</span>
          <strong>
            <CountUp value={durationMinutes(session)} />
          </strong>
        </div>
        <div className="stat stagger" style={{ ['--i' as string]: 2 }}>
          <span className="stat-label">Series</span>
          <strong>
            <CountUp value={stats.sets} />
          </strong>
        </div>
        <div className="stat stagger" style={{ ['--i' as string]: 3 }}>
          <span className="stat-label">Volumen kg</span>
          <strong>
            <CountUp value={stats.volume} />
          </strong>
        </div>
      </div>

      {records.length > 0 && (
        <section className="records stagger" style={{ ['--i' as string]: 4 }}>
          <h2>
            <Trophy size={20} strokeWidth={2.5} aria-hidden="true" /> Récords personales
          </h2>
          <ul>
            {records.map((r) => (
              <li key={r.exercise}>
                <strong>{r.exercise}</strong>
                <span>{recordText(r)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {session.exercises.map((exercise, i) => (
        <section key={exercise.exerciseId} className="card column stagger" style={{ ['--i' as string]: i + 5 }}>
          <h2>{exercise.name}</h2>
          <ol className="set-list">
            {exercise.sets.map((set, si) => (
              <li key={si} className={set.done ? 'done' : 'skipped'}>
                <span className="set-chip">{si + 1}</span>
                <span>
                  {formatSet(set.reps, set.weight)}
                  {set.done ? '' : ' (omitida)'}
                </span>
                {set.done && <Check size={16} strokeWidth={3} className="set-check" aria-hidden="true" />}
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
      <button className="btn danger ghost" onClick={remove}>
        <Trash2 size={18} /> Eliminar entrenamiento
      </button>
    </Screen>
  )
}
