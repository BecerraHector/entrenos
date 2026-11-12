import type { Session } from '../domain/model'

const dateFormat = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const shortDateFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })
const numberFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 1 })

export const formatDate = (iso: string) => dateFormat.format(new Date(iso))
export const formatShortDate = (iso: string) => shortDateFormat.format(new Date(iso))
export const formatNumber = (n: number) => numberFormat.format(n)

export function formatDuration(session: Session): string {
  const minutes = Math.round((Date.parse(session.finishedAt) - Date.parse(session.startedAt)) / 60000)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

/** "8 × 60 kg" or "15 reps" for bodyweight sets. */
export function formatSet(reps: number, weight: number): string {
  return weight > 0 ? `${reps} × ${formatNumber(weight)} kg` : `${reps} reps`
}

/** Accepts both "62.5" and "62,5" (comma keyboards). Empty or invalid input becomes 0. */
export function parseNumber(text: string): number {
  const n = Number(text.trim().replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

/** "1 serie", "3 series". Works for the Spanish nouns used in the UI. */
export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

const dayFormat = new Intl.DateTimeFormat('es', { day: 'numeric' })
const monthFormat = new Intl.DateTimeFormat('es', { month: 'short' })

/** Day of month and short month name, for calendar-style date badges. */
export const formatDayMonth = (iso: string) => ({
  day: dayFormat.format(new Date(iso)),
  month: monthFormat.format(new Date(iso)).replace('.', ''),
})

export const durationMinutes = (session: Session) =>
  Math.max(0, Math.round((Date.parse(session.finishedAt) - Date.parse(session.startedAt)) / 60000))
