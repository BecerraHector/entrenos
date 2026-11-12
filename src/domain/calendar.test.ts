import { describe, expect, it } from 'vitest'
import { dayKey, groupByDay, monthGrid } from './calendar'
import { makeSession } from './fixtures'

describe('monthGrid', () => {
  it('lays out a month in Monday-first weeks with empty leading and trailing cells', () => {
    // March 2026 starts on a Sunday and has 31 days.
    const weeks = monthGrid(2026, 2)
    expect(weeks).toHaveLength(6)
    expect(weeks[0]).toEqual([null, null, null, null, null, null, 1])
    expect(weeks[1]).toEqual([2, 3, 4, 5, 6, 7, 8])
    expect(weeks[5]).toEqual([30, 31, null, null, null, null, null])
  })

  it('handles February in a non-leap year', () => {
    const weeks = monthGrid(2026, 1)
    expect(weeks).toHaveLength(5)
    expect(weeks[4]).toEqual([23, 24, 25, 26, 27, 28, null])
  })
})

describe('dayKey', () => {
  it('uses the local calendar date', () => {
    expect(dayKey(new Date(2026, 2, 5, 23, 30))).toBe('2026-03-05')
  })
})

describe('groupByDay', () => {
  it('groups sessions by the local day they finished', () => {
    const morning = makeSession({ id: 'a', finishedAt: new Date(2026, 2, 5, 8).toISOString() })
    const evening = makeSession({ id: 'b', finishedAt: new Date(2026, 2, 5, 21).toISOString() })
    const other = makeSession({ id: 'c', finishedAt: new Date(2026, 2, 6, 9).toISOString() })
    const groups = groupByDay([morning, evening, other])
    expect(groups.get('2026-03-05')?.map((s) => s.id)).toEqual(['a', 'b'])
    expect(groups.get('2026-03-06')?.map((s) => s.id)).toEqual(['c'])
  })
})
