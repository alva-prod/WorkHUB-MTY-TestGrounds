import { describe, it, expect } from 'vitest'
import { parseTime, formatTime, toMinutes, parseISO, toISO } from '../utils/timeDate'

describe('parseTime', () => {
  it('parses a valid HH:MM string', () => {
    expect(parseTime('09:05')).toEqual({ h: 9, m: 5 })
    expect(parseTime('23:55')).toEqual({ h: 23, m: 55 })
    expect(parseTime('00:00')).toEqual({ h: 0, m: 0 })
  })

  it('returns defaults {h:9, m:0} for falsy input', () => {
    expect(parseTime('')).toEqual({ h: 9, m: 0 })
    expect(parseTime(null)).toEqual({ h: 9, m: 0 })
    expect(parseTime(undefined)).toEqual({ h: 9, m: 0 })
  })

  it('handles non-numeric parts gracefully', () => {
    const result = parseTime('XX:YY')
    expect(result.h).toBe(9)
    expect(result.m).toBe(0)
  })
})

describe('formatTime', () => {
  it('zero-pads single-digit hours and minutes', () => {
    expect(formatTime(9, 5)).toBe('09:05')
    expect(formatTime(0, 0)).toBe('00:00')
  })

  it('handles double-digit hours and minutes without padding', () => {
    expect(formatTime(14, 30)).toBe('14:30')
    expect(formatTime(23, 55)).toBe('23:55')
  })
})

describe('toMinutes', () => {
  it('converts HH:MM to total minutes correctly', () => {
    expect(toMinutes('09:00')).toBe(540)
    expect(toMinutes('01:30')).toBe(90)
    expect(toMinutes('00:00')).toBe(0)
  })

  it('returns -Infinity for falsy input (disables comparisons)', () => {
    expect(toMinutes('')).toBe(-Infinity)
    expect(toMinutes(null)).toBe(-Infinity)
  })
})

describe('parseISO', () => {
  it('parses a YYYY-MM-DD string into a local Date', () => {
    const d = parseISO('2026-06-15')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5) // June = 5
    expect(d.getDate()).toBe(15)
  })

  it('returns null for empty or invalid input', () => {
    expect(parseISO('')).toBeNull()
    expect(parseISO(null)).toBeNull()
    expect(parseISO('invalid')).toBeNull()
  })
})

describe('toISO', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(toISO(new Date(2026, 5, 5))).toBe('2026-06-05')
    expect(toISO(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('round-trips with parseISO', () => {
    const iso = '2026-03-08'
    expect(toISO(parseISO(iso))).toBe(iso)
  })
})
