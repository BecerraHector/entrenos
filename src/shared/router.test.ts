import { describe, expect, it } from 'vitest'
import { parseHash } from './router'

describe('parseHash', () => {
  it.each([
    ['', { name: 'routines' }],
    ['#/', { name: 'routines' }],
    ['#/routines/new', { name: 'routine-edit' }],
    ['#/routines/abc/edit', { name: 'routine-edit', id: 'abc' }],
    ['#/workout/abc', { name: 'workout', routineId: 'abc' }],
    ['#/history', { name: 'history' }],
    ['#/history/s1', { name: 'session', id: 's1' }],
    ['#/history/s1?done=1', { name: 'session', id: 's1', celebrate: true }],
    ['#/progress', { name: 'progress' }],
    ['#/backup', { name: 'backup' }],
    ['#/unknown', { name: 'routines' }],
  ])('maps %s', (hash, route) => {
    expect(parseHash(hash)).toEqual(route)
  })
})
