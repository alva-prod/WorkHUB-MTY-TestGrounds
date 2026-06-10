import { describe, it, expect } from 'vitest'
import {
  mapEstadoToStatus,
  dedupeEspacios,
  mapEspaciosToDesks,
  mapEspaciosToSalas,
  getCluster,
} from '../utils/reservePageUtils'

describe('mapEstadoToStatus', () => {
  it('passes through canonical status values directly', () => {
    expect(mapEstadoToStatus({ status: 'available' })).toBe('available')
    expect(mapEstadoToStatus({ status: 'occupied' })).toBe('occupied')
    expect(mapEstadoToStatus({ status: 'blocked' })).toBe('blocked')
  })

  it('maps legacy Estado field values correctly', () => {
    expect(mapEstadoToStatus({ Estado: 'bloqueado' })).toBe('blocked')
    expect(mapEstadoToStatus({ Estado: 'ocupado' })).toBe('occupied')
    expect(mapEstadoToStatus({ Estado: 'reservado' })).toBe('occupied')
    expect(mapEstadoToStatus({ Estado: 'inactivo' })).toBe('occupied')
  })

  it('defaults to available when no matching state found', () => {
    expect(mapEstadoToStatus({ Estado: 'desconocido' })).toBe('available')
    expect(mapEstadoToStatus({})).toBe('available')
  })
})

describe('dedupeEspacios', () => {
  it('keeps one entry per EspacioID', () => {
    const input = [
      { EspacioID: 1, status: 'available' },
      { EspacioID: 2, status: 'occupied' },
      { EspacioID: 1, status: 'available' },
    ]
    expect(dedupeEspacios(input)).toHaveLength(2)
  })

  it('prefers occupied/blocked over available for the same EspacioID', () => {
    const input = [
      { EspacioID: 5, status: 'available' },
      { EspacioID: 5, status: 'occupied' },
    ]
    const result = dedupeEspacios(input)
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('occupied')
  })

  it('does not overwrite an occupied entry with an available one', () => {
    const input = [
      { EspacioID: 7, status: 'occupied' },
      { EspacioID: 7, status: 'available' },
    ]
    const result = dedupeEspacios(input)
    expect(result[0].status).toBe('occupied')
  })

  it('handles null/empty input gracefully', () => {
    expect(dedupeEspacios(null)).toEqual([])
    expect(dedupeEspacios([])).toEqual([])
  })
})

describe('mapEspaciosToDesks', () => {
  it('includes spaces with Tipo escritorio/desk/office/oficina', () => {
    const input = [
      { EspacioID: 1, Nombre: 'Desk A', Tipo: 'escritorio', status: 'available' },
      { EspacioID: 2, Nombre: 'Desk B', Tipo: 'desk', status: 'available' },
      { EspacioID: 3, Nombre: 'Office 1', Tipo: 'office', status: 'available' },
    ]
    expect(mapEspaciosToDesks(input)).toHaveLength(3)
  })

  it('includes spaces whose names match IC3/PB/MZ patterns', () => {
    const input = [
      { EspacioID: 10, Nombre: 'IC3001', Tipo: 'otro', status: 'available' },
      { EspacioID: 11, Nombre: 'PB007', Tipo: 'otro', status: 'available' },
      { EspacioID: 12, Nombre: 'MZ42', Tipo: 'otro', status: 'available' },
    ]
    expect(mapEspaciosToDesks(input)).toHaveLength(3)
  })

  it('excludes spaces typed as Sala', () => {
    const input = [
      { EspacioID: 20, Nombre: 'Sierra Madre ICSJ-3040', Tipo: 'Sala', status: 'available' },
    ]
    expect(mapEspaciosToDesks(input)).toHaveLength(0)
  })

  it('maps status correctly on each desk', () => {
    const input = [{ EspacioID: 1, Nombre: 'IC3001', Tipo: 'escritorio', status: 'occupied' }]
    const result = mapEspaciosToDesks(input)
    expect(result[0].status).toBe('occupied')
    expect(result[0].id).toBe('IC3001')
    expect(result[0].espacioID).toBe(1)
  })
})

describe('mapEspaciosToSalas', () => {
  it('only includes spaces with Tipo = sala (case-insensitive)', () => {
    const input = [
      { EspacioID: 1, Nombre: 'Sierra Madre ICSJ-3040', Tipo: 'Sala', status: 'available' },
      { EspacioID: 2, Nombre: 'IC3001', Tipo: 'escritorio', status: 'available' },
    ]
    const result = mapEspaciosToSalas(input)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('Sierra Madre ICSJ-3040')
  })

  it('handles empty input', () => {
    expect(mapEspaciosToSalas([])).toEqual([])
    expect(mapEspaciosToSalas(null)).toEqual([])
  })
})

describe('getCluster', () => {
  it('maps IC3 desk numbers to the correct cluster', () => {
    expect(getCluster('IC3001')).toBe('isa')
    expect(getCluster('IC3010')).toBe('c06_13')
    expect(getCluster('IC3022')).toBe('c22_29')
    expect(getCluster('IC3038')).toBe('c36_39')
  })

  it('maps MZ desk numbers to the correct cluster', () => {
    expect(getCluster('MZ1')).toBe('MZ01_MZ06')
    expect(getCluster('MZ10')).toBe('MZ07_MZ16')
    expect(getCluster('MZ110')).toBe('MZ105_MZ114')
  })

  it('maps PB desk numbers to the correct cluster', () => {
    expect(getCluster('PB005')).toBe('PB01_PB07')
    expect(getCluster('PB20')).toBe('PB18_PB23')
    expect(getCluster('PB45')).toBe('PB28_PB47')
  })

  it('maps floor 9 numeric desk names to the correct cluster', () => {
    expect(getCluster('9003')).toBe('9001_9005')
    expect(getCluster('9050')).toBe('9049_9052')
    expect(getCluster('9080')).toBe('9079_9086')
  })

  it('returns "unknown" for unrecognized names', () => {
    expect(getCluster('UNKNOWN')).toBe('unknown')
    expect(getCluster('')).toBe('unknown')
  })
})
