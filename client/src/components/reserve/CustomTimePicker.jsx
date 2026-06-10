import { useEffect, useMemo, useRef, useState } from 'react'
import { parseTime, formatTime as format, toMinutes } from '../../utils/timeDate'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
// Granularidad: cada 5 minutos. Si se necesita exacto se puede escribir al teclear,
// pero para el picker visual 5 min es suficiente y mantiene la lista corta.
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

export default function CustomTimePicker({ value, onChange, min }) {
  const { h: vh, m: vm } = useMemo(() => parseTime(value), [value])
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const hoursRef = useRef(null)
  const minutesRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Auto-scroll a la opción seleccionada al abrir.
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      const hEl = hoursRef.current?.querySelector('[data-active="true"]')
      const mEl = minutesRef.current?.querySelector('[data-active="true"]')
      hEl?.scrollIntoView({ block: 'center' })
      mEl?.scrollIntoView({ block: 'center' })
    })
  }, [open])

  const minMinutes = toMinutes(min)

  const isDisabled = (h, m) => {
    if (minMinutes === -Infinity) return false
    return h * 60 + m < minMinutes
  }

  const pickHour = (h) => {
    // Si la combinación con el minuto actual es inválida, busca el primer minuto válido.
    let newM = vm
    if (isDisabled(h, newM)) {
      const valid = MINUTES.find((mm) => !isDisabled(h, mm))
      if (valid === undefined) return
      newM = valid
    }
    onChange?.(format(h, newM))
  }

  const pickMinute = (m) => {
    if (isDisabled(vh, m)) return
    onChange?.(format(vh, m))
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border-none bg-surface-badge px-3 font-mono text-[13px] text-white transition-colors hover:bg-[#2a0a4a]"
      >
        <span>{format(vh, vm)}</span>
        <svg
          className="h-4 w-4 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-[180px] rounded-xl border border-[#2a0a4a] bg-[#1a0033] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
          <div className="grid grid-cols-2 gap-2">
            {/* Horas */}
            <div className="flex flex-col gap-1">
              <span className="pb-1 text-center font-mono text-[10px] uppercase text-text-muted">
                Hora
              </span>
              <div
                ref={hoursRef}
                className="flex h-40 flex-col gap-0.5 overflow-y-auto pr-1"
              >
                {HOURS.map((h) => {
                  const disabled = isDisabled(h, 0) && !MINUTES.some((mm) => !isDisabled(h, mm))
                  const active = h === vh
                  return (
                    <button
                      key={h}
                      type="button"
                      data-active={active}
                      disabled={disabled}
                      onClick={() => pickHour(h)}
                      className={`h-7 rounded-md border-none font-mono text-[11px] transition-colors ${
                        active
                          ? 'bg-primary text-white font-semibold'
                          : disabled
                          ? 'cursor-not-allowed bg-transparent text-text-muted/30'
                          : 'cursor-pointer bg-transparent text-white hover:bg-primary/30'
                      }`}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Minutos */}
            <div className="flex flex-col gap-1">
              <span className="pb-1 text-center font-mono text-[10px] uppercase text-text-muted">
                Min
              </span>
              <div
                ref={minutesRef}
                className="flex h-40 flex-col gap-0.5 overflow-y-auto pr-1"
              >
                {MINUTES.map((m) => {
                  const disabled = isDisabled(vh, m)
                  const active = m === vm
                  return (
                    <button
                      key={m}
                      type="button"
                      data-active={active}
                      disabled={disabled}
                      onClick={() => pickMinute(m)}
                      className={`h-7 rounded-md border-none font-mono text-[11px] transition-colors ${
                        active
                          ? 'bg-primary text-white font-semibold'
                          : disabled
                          ? 'cursor-not-allowed bg-transparent text-text-muted/30'
                          : 'cursor-pointer bg-transparent text-white hover:bg-primary/30'
                      }`}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
