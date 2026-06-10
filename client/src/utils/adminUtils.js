// Shared utilities extracted from AdminDashboardPage and MyReservationsPage.

export function buildPageList(totalPages, current) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const set = new Set([1, totalPages, current, current - 1, current + 1])
  const sorted = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const out = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push('…')
    out.push(p)
    prev = p
  }
  return out
}

export const clampPercent = (value) => Math.min(Math.max(Math.round(Number(value) || 0), 0), 100)

export const formatPercent = (value) => `${clampPercent(value)}%`

export function parseLocalDate(fecha) {
  if (!fecha) return null
  const dateOnly = String(fecha).slice(0, 10)
  const [y, m, d] = dateOnly.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(dateStr) {
  const d = parseLocalDate(dateStr)
  if (!d) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${day}/${months[d.getMonth()]}/${d.getFullYear()}`
}

export function formatTimeRange(start, end) {
  if (!start || !end) return '—'
  return `${start.slice(0, 5)} — ${end.slice(0, 5)}`
}
