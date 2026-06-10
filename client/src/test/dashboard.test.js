import { describe, it, expect, vi } from 'vitest'

// Mock apiRequest so the module loads cleanly without a real backend
vi.mock('../services/api', () => ({
  apiRequest: vi.fn(),
}))

import { normalizeDashboardResponse } from '../services/dashboard'

describe('normalizeDashboardResponse', () => {
  it('returns default shape on empty input', () => {
    const result = normalizeDashboardResponse({})
    expect(result.success).toBe(true)
    expect(result.stats).toBeDefined()
    expect(Array.isArray(result.floors)).toBe(true)
    expect(Array.isArray(result.data)).toBe(true)
    expect(Array.isArray(result.recentActivity)).toBe(true)
  })

  it('calculates occupancyPercent from occupied/total when not supplied', () => {
    const raw = {
      stats: { totalSpaces: 100, occupiedSpaces: 40 },
    }
    const result = normalizeDashboardResponse(raw)
    expect(result.stats.occupancyPercent).toBe(40)
  })

  it('returns 0 occupancyPercent when total is 0 (avoids division by zero)', () => {
    const raw = {
      stats: { totalSpaces: 0, occupiedSpaces: 0 },
    }
    const result = normalizeDashboardResponse(raw)
    expect(result.stats.occupancyPercent).toBe(0)
  })

  it('uses rawPercent from stats if provided, ignoring calculation', () => {
    const raw = {
      stats: { totalSpaces: 100, occupiedSpaces: 80, occupancyPercent: 55 },
    }
    const result = normalizeDashboardResponse(raw)
    expect(result.stats.occupancyPercent).toBe(55)
  })

  it('builds floors from raw.floors array with calculated percentages', () => {
    const raw = {
      floors: [
        { label: 'Piso 3', total: 40, ocupados: 20, pisoId: 3 },
        { label: 'Piso 9', total: 56, occupied: 14, pisoId: 9 },
      ],
    }
    const result = normalizeDashboardResponse(raw)
    expect(result.floors).toHaveLength(2)
    expect(result.floors[0].label).toBe('Piso 3')
    expect(result.floors[0].occupancyPercent).toBe(50)
    expect(result.floors[1].occupancyPercent).toBe(25)
  })

  it('selects piso 3 as the default selectedFloor when available', () => {
    const raw = {
      floors: [
        { label: 'Piso 9', total: 56, occupied: 14, pisoId: 9 },
        { label: 'Piso 3', total: 40, ocupados: 20, pisoId: 3 },
      ],
    }
    const result = normalizeDashboardResponse(raw)
    expect(result.selectedFloor).toBe('Piso 3')
  })

  it('falls back to first floor when piso 3 is absent', () => {
    const raw = {
      floors: [
        { label: 'Piso 9', total: 56, occupied: 14, pisoId: 9 },
      ],
    }
    const result = normalizeDashboardResponse(raw)
    expect(result.selectedFloor).toBe('Piso 9')
  })

  it('normalizes recentActivity time field to HH:MM (truncates seconds)', () => {
    const raw = {
      recentActivity: [
        { id: 1, text: 'Check-in', time: '09:15:30', status: 'Activa' },
        { id: 2, texto: 'Check-out', hora: '14:00:00', estatus: 'Completada' },
      ],
    }
    const result = normalizeDashboardResponse(raw)
    expect(result.recentActivity[0].time).toBe('09:15')
    expect(result.recentActivity[1].time).toBe('14:00')
  })

  it('normalizes rows with inconsistent field names via normalizeRollupRows', () => {
    const raw = {
      data: [
        { piso: 3, total: 40, occupied: 20, available: 20 },
        { Piso: null, Total: 200, ocupados: 50 },
      ],
    }
    const result = normalizeDashboardResponse(raw)
    // total row (Piso === null) is excluded from floors but feeds stats
    expect(result.data[0].total).toBe(40)
    expect(result.data[0].ocupados).toBe(20)
  })

  it('sets hasBackendData=true when floors are present', () => {
    const raw = {
      floors: [{ label: 'Piso 3', total: 40, occupied: 10, pisoId: 3 }],
    }
    const result = normalizeDashboardResponse(raw)
    expect(result.hasBackendData).toBe(true)
  })

  it('sets hasBackendData=false on empty response', () => {
    const result = normalizeDashboardResponse({})
    expect(result.hasBackendData).toBe(false)
  })
})
