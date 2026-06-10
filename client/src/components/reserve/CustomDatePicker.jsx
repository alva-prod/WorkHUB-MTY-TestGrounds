import { useEffect, useMemo, useRef, useState } from 'react'
import { parseISO, toISO } from '../../utils/timeDate'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1)
}

function formatLabel(date) {
  if (!date) return 'Selecciona una fecha'
  const day = String(date.getDate()).padStart(2, '0')
  const month = MONTHS[date.getMonth()].slice(0, 3)
  return `${day} / ${month} / ${date.getFullYear()}`
}

export default function CustomDatePicker({ value, onChange, min, max }) {
  const selected = useMemo(() => parseISO(value), [value])
  const minDate = useMemo(() => parseISO(min), [min])
  const maxDate = useMemo(() => parseISO(max), [max])
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected || new Date()))
  const containerRef = useRef(null)

  useEffect(() => {
    if (selected) setViewMonth(startOfMonth(selected))
  }, [selected])

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

  const days = useMemo(() => {
    const first = startOfMonth(viewMonth)
    // getDay(): 0 = domingo. Queremos lunes como primer día.
    const weekdayOffset = (first.getDay() + 6) % 7
    const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < weekdayOffset; i++) cells.push(null)
    for (let d = 1; d <= lastDay; d++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d))
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewMonth])

  const isDisabled = (d) => {
    if (!d) return false
    const a = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (minDate) {
      const b = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
      if (a < b) return true
    }
    if (maxDate) {
      const c = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
      if (a > c) return true
    }
    return false
  }

  const isSelected = (d) =>
    d && selected &&
    d.getFullYear() === selected.getFullYear() &&
    d.getMonth() === selected.getMonth() &&
    d.getDate() === selected.getDate()

  const isToday = (d) => {
    if (!d) return false
    const t = new Date()
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    )
  }

  const handlePick = (d) => {
    if (!d || isDisabled(d)) return
    onChange?.(toISO(d))
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border-none bg-surface-badge px-3 font-mono text-[13px] text-white transition-colors hover:bg-[#2a0a4a]"
      >
        <span className={selected ? 'text-white' : 'text-text-muted'}>
          {formatLabel(selected)}
        </span>
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
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-[280px] rounded-xl border border-[#2a0a4a] bg-[#1a0033] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2">
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-none bg-surface-badge text-white transition-colors hover:bg-primary"
            >
              ‹
            </button>
            <span className="font-mono text-xs font-semibold text-white">
              {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-none bg-surface-badge text-white transition-colors hover:bg-primary"
            >
              ›
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 pb-1">
            {WEEKDAYS.map((w, i) => (
              <span
                key={i}
                className="text-center font-mono text-[10px] uppercase text-text-muted"
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (!d) return <span key={i} className="h-8" />
              const disabled = isDisabled(d)
              const sel = isSelected(d)
              const today = isToday(d)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => handlePick(d)}
                  className={`h-8 rounded-md border-none font-mono text-[11px] transition-colors ${
                    sel
                      ? 'bg-primary text-white font-semibold'
                      : today
                      ? 'bg-surface-badge text-accent ring-1 ring-accent cursor-pointer hover:bg-primary/30'
                      : disabled
                      ? 'cursor-not-allowed bg-transparent text-text-muted/30'
                      : 'cursor-pointer bg-transparent text-white hover:bg-primary/30'
                  }`}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
