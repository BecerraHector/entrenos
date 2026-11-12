import type { Session } from './model'

/** Local calendar date as `YYYY-MM-DD`. */
export function dayKey(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

/**
 * Weeks of a month, Monday first. Cells outside the month are `null`.
 * `month` is 0-based, like `Date#getMonth`.
 */
export function monthGrid(year: number, month: number): (number | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = (new Date(year, month, 1).getDay() + 6) % 7
  const cells: (number | null)[] = [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** Sessions grouped by the local day they finished, keeping input order inside each day. */
export function groupByDay(sessions: Session[]): Map<string, Session[]> {
  const groups = new Map<string, Session[]>()
  for (const session of sessions) {
    const key = dayKey(new Date(session.finishedAt))
    groups.set(key, [...(groups.get(key) ?? []), session])
  }
  return groups
}
