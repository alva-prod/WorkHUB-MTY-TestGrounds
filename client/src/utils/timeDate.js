// Shared time/date utilities used by CustomTimePicker and CustomDatePicker.

export function parseTime(value) {
  if (!value) return { h: 9, m: 0 }
  const [h, m] = String(value).split(':').map(Number)
  return {
    h: Number.isFinite(h) ? h : 9,
    m: Number.isFinite(m) ? m : 0,
  }
}

export function formatTime(h, m) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function toMinutes(value) {
  if (!value) return -Infinity
  const { h, m } = parseTime(value)
  return h * 60 + m
}

export function parseISO(value) {
  if (!value) return null
  const [y, mo, d] = String(value).split('-').map(Number)
  if (!y || !mo || !d) return null
  return new Date(y, mo - 1, d)
}

export function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
