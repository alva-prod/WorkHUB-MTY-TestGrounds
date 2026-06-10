import { describe, it, expect } from 'vitest'
import {
  buildPageList,
  clampPercent,
  formatPercent,
  parseLocalDate,
  formatDate,
  formatTimeRange,
} from '../utils/adminUtils'

describe('buildPageList', () => {
  it('returns all pages when totalPages <= 7', () => {
    expect(buildPageList(5, 3)).toEqual([1, 2, 3, 4, 5])
    expect(buildPageList(7, 4)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('includes first, last, current, and neighbors with ellipsis gaps', () => {
    const result = buildPageList(20, 10)
    expect(result).toContain(1)
    expect(result).toContain(20)
    expect(result).toContain(10)
    expect(result).toContain('…')
  })

  it('does not include page numbers outside [1, totalPages]', () => {
    const result = buildPageList(10, 1)
    const nums = result.filter((p) => typeof p === 'number')
    expect(nums.every((p) => p >= 1 && p <= 10)).toBe(true)
  })

  it('result for current=1 starts at 1 without leading ellipsis', () => {
    const result = buildPageList(20, 1)
    expect(result[0]).toBe(1)
    expect(result[1]).not.toBe('…')
  })
})

describe('clampPercent', () => {
  it('clamps values above 100 to 100', () => {
    expect(clampPercent(150)).toBe(100)
    expect(clampPercent(101)).toBe(100)
  })

  it('clamps values below 0 to 0', () => {
    expect(clampPercent(-10)).toBe(0)
    expect(clampPercent(-0.5)).toBe(0)
  })

  it('passes valid percentages through unchanged', () => {
    expect(clampPercent(50)).toBe(50)
    expect(clampPercent(0)).toBe(0)
    expect(clampPercent(100)).toBe(100)
  })

  it('rounds decimal values', () => {
    expect(clampPercent(73.7)).toBe(74)
    expect(clampPercent(73.2)).toBe(73)
  })

  it('handles non-numeric input by returning 0', () => {
    expect(clampPercent(null)).toBe(0)
    expect(clampPercent('abc')).toBe(0)
  })
})

describe('formatPercent', () => {
  it('appends % to the clamped value', () => {
    expect(formatPercent(50)).toBe('50%')
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(100)).toBe('100%')
    expect(formatPercent(150)).toBe('100%')
  })
})

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD into the correct local date', () => {
    const d = parseLocalDate('2026-06-10')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(10)
  })

  it('handles ISO datetime strings by taking only the date portion', () => {
    const d = parseLocalDate('2026-06-10T05:00:00.000Z')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(10)
  })

  it('returns null for falsy input', () => {
    expect(parseLocalDate(null)).toBeNull()
    expect(parseLocalDate('')).toBeNull()
  })
})

describe('formatDate', () => {
  it('formats YYYY-MM-DD as DD/Mon/YYYY', () => {
    expect(formatDate('2026-01-05')).toBe('05/Ene/2026')
    expect(formatDate('2026-12-31')).toBe('31/Dic/2026')
  })

  it('returns em-dash for falsy input', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
  })
})

describe('formatTimeRange', () => {
  it('formats a time range as HH:MM — HH:MM', () => {
    expect(formatTimeRange('09:00:00', '18:00:00')).toBe('09:00 — 18:00')
    expect(formatTimeRange('08:30', '17:45')).toBe('08:30 — 17:45')
  })

  it('returns em-dash when either time is missing', () => {
    expect(formatTimeRange(null, '18:00')).toBe('—')
    expect(formatTimeRange('09:00', null)).toBe('—')
    expect(formatTimeRange(null, null)).toBe('—')
  })
})
