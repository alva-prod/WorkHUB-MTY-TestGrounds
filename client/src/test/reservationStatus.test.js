import { describe, it, expect } from 'vitest'
import { classifyReservation, getStatusStyle, STATUS_STYLE } from '../utils/reservationStatus'

describe('classifyReservation', () => {
  it('classifies "Próxima" (with accent) as upcoming', () => {
    expect(classifyReservation({ EstatusNombre: 'Próxima' })).toBe('upcoming')
  })

  it('classifies "proxima" (no accent) as upcoming', () => {
    expect(classifyReservation({ EstatusNombre: 'proxima' })).toBe('upcoming')
  })

  it('classifies "Activa" and "En periodo de gracia" as active', () => {
    expect(classifyReservation({ EstatusNombre: 'Activa' })).toBe('active')
    expect(classifyReservation({ EstatusNombre: 'En periodo de gracia' })).toBe('active')
  })

  it('classifies "Cancelada" as cancelled', () => {
    expect(classifyReservation({ EstatusNombre: 'Cancelada' })).toBe('cancelled')
  })

  it('classifies "Completada" and "Liberada" as past', () => {
    expect(classifyReservation({ EstatusNombre: 'Completada' })).toBe('past')
    expect(classifyReservation({ EstatusNombre: 'Liberada' })).toBe('past')
  })

  it('classifies unknown statuses as past', () => {
    expect(classifyReservation({ EstatusNombre: 'Desconocido' })).toBe('past')
  })

  it('handles null/undefined EstatusNombre gracefully', () => {
    expect(classifyReservation({})).toBe('past')
    expect(classifyReservation(null)).toBe('past')
  })
})

describe('getStatusStyle', () => {
  it('returns purple style for "Próxima"', () => {
    const style = getStatusStyle({ EstatusNombre: 'Próxima' })
    expect(style.label).toBe('Confirmada')
    expect(style.text).toBe('#A100FF')
  })

  it('returns orange/amber style for "En periodo de gracia"', () => {
    const style = getStatusStyle({ EstatusNombre: 'En periodo de gracia' })
    expect(style.label).toBe('En periodo de gracia')
    expect(style.text).toBe('#ffb648')
  })

  it('returns green style for "Activa"', () => {
    const style = getStatusStyle({ EstatusNombre: 'Activa' })
    expect(style.label).toBe('En curso')
    expect(style.text).toBe('#05f0a5')
  })

  it('returns red style for "Cancelada"', () => {
    const style = getStatusStyle({ EstatusNombre: 'Cancelada' })
    expect(style.label).toBe('Cancelada')
    expect(style.text).toBe('#ff5c7a')
  })

  it('falls back to category style for unknown statuses', () => {
    const style = getStatusStyle({ EstatusNombre: 'XYZ Desconocido' })
    expect(style).toEqual(STATUS_STYLE['past'])
  })

  it('normalizes "proxima" (no accent) to the same style as "Próxima"', () => {
    const withAccent = getStatusStyle({ EstatusNombre: 'Próxima' })
    const withoutAccent = getStatusStyle({ EstatusNombre: 'proxima' })
    expect(withAccent.label).toBe(withoutAccent.label)
    expect(withAccent.text).toBe(withoutAccent.text)
  })
})
