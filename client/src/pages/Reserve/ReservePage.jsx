import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import BookingSidebar from '../../components/reserve/BookingSidebar'
import FloorMap from '../../components/reserve/FloorMap'
import { getEspaciosDisponibilidad } from '../../services/reservations'
import { rooms as fallbackRooms } from '../../data/floorData'
import { mapEstadoToStatus, dedupeEspacios, mapEspaciosToDesks, mapEspaciosToSalas } from '../../utils/reservePageUtils'

export default function ReservePage() {
  const navigate = useNavigate()
  const [selectedDesk, setSelectedDesk] = useState(null)
  const [deskData, setDeskData] = useState([])
  const [salasData, setSalasData] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fechaBloqueada, setFechaBloqueada] = useState(null)
  const [floor, setFloor] = useState(null)

  // Track current filters from the sidebar
  const filtersRef = useRef({ date: '', entryTime: '09:00', exitTime: '18:00' })

  const fetchAvailability = useCallback(async (filters) => {
    if (!filters.date || !filters.entryTime || !filters.exitTime) return
    setLoading(true)
    setError(null)
    try {
      const res = await getEspaciosDisponibilidad(
        filters.date,
        filters.entryTime,
        filters.exitTime,
        filters.floor
      )
      const espacios = dedupeEspacios(res.data || [])
      const desks = mapEspaciosToDesks(espacios)
      const salas = mapEspaciosToSalas(espacios)
      setDeskData(desks)
      setSalasData(salas)
      setStats(res.stats || null)
    } catch (err) {
      console.error('Error fetching availability:', err)
      setError(err?.error || 'Error al obtener disponibilidad')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFiltersChange = useCallback(
    (filters) => {
      filtersRef.current = filters
      setFloor(filters?.floor || null)
      setFechaBloqueada(filters?.fechaBloqueada || null)
      // Deselect desk when filters change
      setSelectedDesk(null)
      fetchAvailability(filters)
    },
    [fetchAvailability]
  )

  const handleSelectDesk = (id) => {
    setSelectedDesk(id === selectedDesk ? null : id)
  }

  const handleReserve = (formData) => {
    if (!selectedDesk) return

    // El elemento seleccionado puede ser un escritorio (IC3xxx) o una sala.
    const item =
      deskData.find((d) => d.id === selectedDesk) ||
      salasData.find((s) => s.id === selectedDesk)

    const baseState = {
      deskId: selectedDesk,
      espacioID: item?.espacioID,
      date: formData.date,
      entryTime: formData.entryTime,
      exitTime: formData.exitTime,
      reserveFor: formData.reserveFor,
    }

    // Visitante: no pasa por estacionamiento (lo elige el visitante después).
    // Va a la pantalla "Invitación enviada", que crea la invitación.
    if (formData.reserveFor === 'visitor') {
      navigate('/invitacion-enviada', { state: { ...baseState, visitor: formData.visitor } })
      return
    }

    navigate('/estacionamiento', { state: baseState })
  }

  return (
    <div className="flex min-h-[calc(100dvh-64px)] flex-col lg:h-[calc(100dvh-64px)] lg:flex-row">
      <BookingSidebar
        selectedDesk={selectedDesk}
        onReserve={handleReserve}
        stats={stats}
        loadingStats={loading}
        onFiltersChange={handleFiltersChange}
      />
      {error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <p className="font-mono text-sm text-[#ff3246]">{error}</p>
            <button
              onClick={() => fetchAvailability(filtersRef.current)}
              className="h-10 px-6 rounded-lg bg-primary font-mono text-sm text-white border-none cursor-pointer hover:bg-primary-dark transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <div className="relative flex-1 flex overflow-hidden">
          {/**
           * Dynamically load `FloorMap<PisoID>.jsx` when available.
           * Fallback order:
           *  - FloorMap{floor}.jsx (dynamic)
           *  - FloorMap9.jsx (for historical Piso 9 mapping)
           *  - FloorMap.jsx (default)
           */}
          {(() => {
            const LazyComp = useMemo(() => {
              if (!floor) return null
              return lazy(() =>
                import(`../../components/reserve/FloorMap${floor}.jsx`).catch(() => {
                  if (floor === '1') return import('../../components/reserve/FloorMap9.jsx')
                  if (floor === '2') return import('../../components/reserve/FloorMap.jsx')
                  if (floor === '3') return import('../../components/reserve/FloorMapPB.jsx')
                  if (floor === '4') return import('../../components/reserve/FloorMapMZ.jsx')
                  return import('../../components/reserve/FloorMap.jsx')
                })
              )
            }, [floor])

            return (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center">Cargando mapa...</div>}>
                {LazyComp ? (
                  <LazyComp
                    desks={deskData}
                    salas={salasData}
                    rooms={fallbackRooms}
                    selectedDesk={selectedDesk}
                    onSelectDesk={fechaBloqueada ? () => {} : handleSelectDesk}
                    loading={loading}
                  />
                ) : (
                  <FloorMap
                    desks={deskData}
                    salas={salasData}
                    rooms={fallbackRooms}
                    selectedDesk={selectedDesk}
                    onSelectDesk={fechaBloqueada ? () => {} : handleSelectDesk}
                    loading={loading}
                  />
                )}
              </Suspense>
            )
          })()}
          {fechaBloqueada && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 px-6">
              <div
                className="max-w-md w-full rounded-2xl border p-6 flex flex-col gap-3 text-center"
                style={{
                  backgroundColor: 'rgba(255,50,70,0.10)',
                  borderColor: 'rgba(255,50,70,0.55)',
                }}
              >
                <h3 className="font-heading text-xl font-bold uppercase text-white">
                  No puedes reservar este horario
                </h3>
                <p
                  className="font-mono text-[12px] leading-[1.6]"
                  style={{ color: '#ff3246' }}
                >
                  {fechaBloqueada.motivo}
                </p>
                <p className="font-mono text-[11px] text-text-muted">
                  Elige un horario distinto para poder reservar.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
