import { describe, expect, it } from 'vitest'
import { parseNumber, plural } from './format'

describe('parseNumber', () => {
  it('accepts dot and comma decimals', () => {
    expect(parseNumber('62.5')).toBe(62.5)
    expect(parseNumber(' 62,5 ')).toBe(62.5)
  })

  it('turns empty, invalid or negative input into 0', () => {
    expect(parseNumber('')).toBe(0)
    expect(parseNumber('abc')).toBe(0)
    expect(parseNumber('-5')).toBe(0)
  })
})

describe('plural', () => {
  it('uses the singular only for exactly one', () => {
    expect(plural(1, 'serie')).toBe('1 serie')
    expect(plural(0, 'serie')).toBe('0 series')
    expect(plural(3, 'rutina')).toBe('3 rutinas')
  })
})
