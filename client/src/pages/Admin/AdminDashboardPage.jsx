import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useDashboard } from '../../context/useDashboard'
import { useAuth } from '../../context/useAuth'
import { getAllEmpleados, getAllReservaciones, getReportes, createEmpleado, deleteEmpleado, getAllEspacios, createEspacio, updateEspacioEstado, getPisos, getRoles, getEventos, createEvento, deleteEvento } from '../../services/reservations'
import CustomDatePicker from '../../components/reserve/CustomDatePicker'
import CustomTimePicker from '../../components/reserve/CustomTimePicker'
import { buildPageList, clampPercent, formatPercent } from '../../utils/adminUtils'
import './AdminDashboard.css'

const sidebarItems = [
  { label: 'Dashboard', icon: 'stack' },
  { label: 'Reportes', icon: 'bars' },
  { label: 'Espacios', icon: 'square' },
  { label: 'Usuarios', icon: 'user' },
  { label: 'Reservas', icon: 'group' },
  { label: 'Eventos', icon: 'calendar' },
]

// Filas por página en las tablas del panel.
const ADMIN_PAGE_SIZE = 15

// Footer de paginación reutilizable. Recibe la página actual (ya acotada),
// el total filtrado y el total real, y notifica cambios vía onPage.
function AdminPagination({ page, filteredTotal, total, onPage, noun, pageSize = ADMIN_PAGE_SIZE }) {
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  const from = filteredTotal === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, filteredTotal)
  const extra = filteredTotal !== total ? ` (filtrados de ${total})` : ''
  return (
    <div className="admin-pagination">
      <span>
        Mostrando {from}{from !== to ? `–${to}` : ''} de {filteredTotal} {noun}{extra}
      </span>
      {totalPages > 1 && (
        <div>
          <button type="button" onClick={() => onPage(current - 1)} disabled={current <= 1} aria-label="Anterior">‹</button>
          {buildPageList(totalPages, current).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="admin-pagination__gap" aria-hidden="true">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={p === current ? 'is-active' : ''}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            )
          )}
          <button type="button" onClick={() => onPage(current + 1)} disabled={current >= totalPages} aria-label="Siguiente">›</button>
        </div>
      )}
    </div>
  )
}

const emptyStats = [
  {
    label: 'Escritorios',
    value: '0',
    detail: 'sin datos',
    accent: 'admin-stat--violet',
    icon: 'desktop',
  },
  {
    label: 'Ocupados',
    value: '0',
    detail: 'sin datos',
    accent: 'admin-stat--rose',
    icon: 'userSquare',
  },
  {
    label: 'Disponibles',
    value: '0',
    detail: 'sin datos',
    accent: 'admin-stat--mint',
    icon: 'checkSquare',
  },
  {
    label: 'Cajones',
    value: '0',
    detail: 'sin datos',
    accent: 'admin-stat--violet',
    icon: 'car',
  },
  {
    label: '% Ocupacion',
    value: '0%',
    detail: 'sin datos',
    accent: 'admin-stat--outline',
    icon: null,
  },
  {
    label: 'Bloqueados',
    value: '0',
    detail: 'sin datos',
    accent: 'admin-stat--yellow',
    icon: 'lock',
  },
]

const loadingStats = emptyStats.map((stat) => ({
  ...stat,
  detail: 'cargando',
}))

const PISO_ADMIN_FUNCIONAL_ID = 2

function AdminIcon({ name }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  const icons = {
    stack: (
      <>
        <path {...common} d="M4 7h16" />
        <path {...common} d="M4 12h16" />
        <path {...common} d="M4 17h16" />
      </>
    ),
    bars: (
      <>
        <path {...common} d="M5 19V9" />
        <path {...common} d="M12 19V5" />
        <path {...common} d="M19 19v-7" />
      </>
    ),
    square: <rect {...common} x="5" y="5" width="14" height="14" rx="3" />,
    user: (
      <>
        <path {...common} d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path {...common} d="M5 19a7 7 0 0 1 14 0" />
      </>
    ),
    ban: (
      <>
        <circle {...common} cx="12" cy="12" r="8" />
        <path {...common} d="m7 7 10 10" />
      </>
    ),
    group: (
      <>
        <path {...common} d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path {...common} d="M17 12a2.5 2.5 0 1 0 0-5" />
        <path {...common} d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <path {...common} d="M15.5 19a4 4 0 0 0-3-3.9" />
      </>
    ),
    calendar: (
      <>
        <rect {...common} x="4.5" y="5.5" width="15" height="14" rx="2" />
        <path {...common} d="M8 3.5v4" />
        <path {...common} d="M16 3.5v4" />
        <path {...common} d="M4.5 9.5h15" />
      </>
    ),
    desktop: (
      <>
        <rect {...common} x="4" y="5" width="16" height="11" rx="2" />
        <path {...common} d="M10 19h4" />
        <path {...common} d="M12 16v3" />
      </>
    ),
    userSquare: (
      <>
        <rect {...common} x="4" y="4" width="16" height="16" rx="3" />
        <path {...common} d="M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path {...common} d="M8 17a4 4 0 0 1 8 0" />
      </>
    ),
    checkSquare: (
      <>
        <rect {...common} x="4" y="4" width="16" height="16" rx="3" />
        <path {...common} d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    car: (
      <>
        <path {...common} d="M6 16V9.5L8 6h8l2 3.5V16" />
        <path {...common} d="M4.5 11h15" />
        <path {...common} d="M7 16v2" />
        <path {...common} d="M17 16v2" />
      </>
    ),
    lock: (
      <>
        <rect {...common} x="5" y="10" width="14" height="10" rx="2" />
        <path {...common} d="M8 10V8a4 4 0 1 1 8 0v2" />
      </>
    ),
    message: (
      <>
        <path {...common} d="M5 6.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      </>
    ),
    download: (
      <>
        <path {...common} d="M12 4v12M8 12l4 4 4-4" />
        <path {...common} d="M4 19h16" />
      </>
    ),
    search: (
      <>
        <circle {...common} cx="10.5" cy="10.5" r="6.5" />
        <path {...common} d="m16 16 4 4" />
      </>
    ),
    plusBox: (
      <>
        <rect {...common} x="5" y="5" width="14" height="14" rx="3" />
        <path {...common} d="M12 8v8" />
        <path {...common} d="M8 12h8" />
      </>
    ),
    trash: (
      <>
        <path {...common} d="M4 7h16" />
        <path {...common} d="M10 11v6" />
        <path {...common} d="M14 11v6" />
        <path {...common} d="M6 7l1 13h10l1-13" />
        <path {...common} d="M9 7V4h6v3" />
      </>
    ),
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

// ── Reportes helpers ──────────────────────────────────────
const toLocalDateInput = (date) => {
  const copy = new Date(date)
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset())
  return copy.toISOString().slice(0, 10)
}

const getMonthStartInput = () => {
  const now = new Date()
  return toLocalDateInput(new Date(now.getFullYear(), now.getMonth(), 1))
}

const formatDateForReport = (date) => {
  if (!date) return ''
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

const average = (values) => {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

// Agrupa por el lunes de la semana (dd/mm) para que semanas de meses
// distintos no se mezclen entre sí cuando el rango cruza de mes.
const getWeekKey = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `Sem ${dd}/${mm}`
}

// Máximo de puntos que la gráfica de ocupación pinta sin saturarse;
// los modos que generen más quedan deshabilitados. Semana tolera menos
// porque sus labels ("Sem dd/mm") son más anchos.
const MAX_CHART_POINTS = { dia: 31, semana: 18, mes: 31 }
const RANGE_MODES = ['dia', 'semana', 'mes']

const aggregateOcupacion = (items = [], mode = 'dia') => {
  if (mode === 'dia') {
    return items.map((item) => ({
      label: item.label || item.fecha?.slice(5) || '',
      value: clampPercent(item.occupancyPercent),
    }))
  }

  const groups = new Map()
  items.forEach((item) => {
    const key = mode === 'semana'
      ? getWeekKey(item.fecha)
      : item.fecha?.slice(0, 7)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(clampPercent(item.occupancyPercent))
  })

  return [...groups.entries()].map(([label, values]) => ({
    label,
    value: average(values),
  }))
}

const sanitizePdfText = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7E]/g, '')

const escapePdfText = (value) => sanitizePdfText(value).replace(/[\\()]/g, '\\$&')

const buildSimplePdf = (title, lines) => {
  const pageLines = []
  const maxLines = 42
  for (let i = 0; i < lines.length; i += maxLines) {
    pageLines.push(lines.slice(i, i + maxLines))
  }

  const objects = [
    '',
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  const pageIds = []
  pageLines.forEach((page, index) => {
    const content = [
      'BT',
      '/F1 18 Tf',
      `50 780 Td (${escapePdfText(index === 0 ? title : `${title} cont.`)}) Tj`,
      '/F1 10 Tf',
      '0 -28 Td',
      ...page.flatMap((line) => [`(${escapePdfText(line)}) Tj`, '0 -16 Td']),
      'ET',
    ].join('\n')
    const contentId = objects.length
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
    const pageId = objects.length
    pageIds.push(pageId)
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`)
  })
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`

  const offsets = []
  let body = '%PDF-1.4\n'
  objects.forEach((object, index) => {
    if (index === 0) return
    offsets[index] = body.length
    body += `${index} 0 obj\n${object}\nendobj\n`
  })

  const xrefStart = body.length
  body += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let i = 1; i < objects.length; i += 1) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  body += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return new Blob([body], { type: 'application/pdf' })
}

const downloadReportPdf = ({ report, filters, selectedFloorLabel }) => {
  const lines = [
    `Periodo: ${formatDateForReport(filters.fechaInicio)} - ${formatDateForReport(filters.fechaFin)}`,
    `Piso: ${selectedFloorLabel || 'Todos los pisos'}`,
    `Tipo: ${filters.tipo === 'todos' ? 'Todos' : filters.tipo}`,
    '',
    'Resumen',
    `Reservas analizadas: ${report.summary?.totalReservas ?? 0}`,
    `Espacios considerados: ${report.summary?.totalSpaces ?? 0}`,
    `No-shows: ${report.summary?.noShows ?? 0}`,
    `Tasa de no-shows: ${report.summary?.noShowRate ?? 0}%`,
    `Cambio vs periodo anterior: ${report.summary?.noShowDelta ?? 0} puntos`,
    '',
    'Horarios de mayor demanda',
    ...(report.demandaHoras || []).map((item) => `${item.hora}: ${item.total} reservas`),
    '',
    'Zonas mas / menos utilizadas',
    ...(report.zonasUso || []).map((item) => `${item.zona} / ${item.piso}: ${item.percentage}% (${item.total})`),
  ]
  const blob = buildSimplePdf('WorkHub MTY - Reporte de ocupacion', lines)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `workhub-reporte-${filters.fechaInicio}-${filters.fechaFin}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function ReportesView() {
  const [filters, setFilters] = useState({
    fechaInicio: getMonthStartInput(),
    fechaFin: toLocalDateInput(new Date()),
    pisoId: 'todos',
    tipo: 'todos',
  })
  const [rangeMode, setRangeMode] = useState('dia')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError(null)

    getReportes(filters)
      .then((res) => {
        if (!ignore) setReport(res)
      })
      .catch((err) => {
        if (!ignore) {
          setReport(null)
          setError(err?.error || 'No se pudieron cargar los reportes')
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [filters])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  // Los reportes permiten consultar hasta 12 meses hacia atrás; la
  // granularidad de la gráfica se adapta sola al tamaño del rango.
  const minReportDate = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 12)
    return toLocalDateInput(d)
  })()

  const selectedFloorLabel = filters.pisoId === 'todos'
    ? 'Todos los pisos'
    : report?.catalogs?.pisos?.find((piso) => String(piso.PisoID) === String(filters.pisoId))?.Nombre

  const ocupacionPorModo = {
    dia: aggregateOcupacion(report?.ocupacionPromedio || [], 'dia'),
    semana: aggregateOcupacion(report?.ocupacionPromedio || [], 'semana'),
    mes: aggregateOcupacion(report?.ocupacionPromedio || [], 'mes'),
  }
  const modeDisponible = (mode) => ocupacionPorModo[mode].length <= MAX_CHART_POINTS[mode]
  const ocupacionData = ocupacionPorModo[rangeMode]

  // Escala Y dinámica: el eje se ajusta al rango real de los datos (con un
  // margen) en lugar de ir fijo de 0 a 100, para que las diferencias entre
  // puntos se aprecien aunque la ocupación se mueva en una banda angosta.
  // Las líneas de referencia con su % conservan la lectura absoluta.
  const chartValues = ocupacionData.map((item) => clampPercent(item.value))
  const chartMin = chartValues.length ? Math.min(...chartValues) : 0
  const chartMax = chartValues.length ? Math.max(...chartValues) : 100
  const chartPad = Math.max((chartMax - chartMin) * 0.15, 2)
  const domainMin = Math.max(0, chartMin - chartPad)
  const domainMax = Math.min(100, chartMax + chartPad)
  // Banda vertical del lienzo: 12% (arriba) a 80% (abajo).
  const yForValue = (value) => 80 - ((value - domainMin) / (domainMax - domainMin)) * 68

  // Si el rango elegido genera demasiados puntos para el modo actual,
  // brincamos a la granularidad más fina que sí quepa (dia -> semana -> mes).
  useEffect(() => {
    if (modeDisponible(rangeMode)) return
    setRangeMode(RANGE_MODES.find(modeDisponible) || 'mes')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, rangeMode])
  const noShowDelta = Number(report?.summary?.noShowDelta || 0)
  const noShowTrendText = noShowDelta === 0
    ? 'sin cambio vs periodo anterior'
    : `${noShowDelta > 0 ? '↑' : '↓'} ${Math.abs(noShowDelta).toFixed(1)} pts vs periodo anterior`
  const maxNoShows = Math.max(...(report?.noShowsPorPiso || []).map((item) => item.noShows), 1)
  const maxDemand = Math.max(...(report?.demandaHoras || []).map((item) => item.total), 1)

  const handleExportPdf = () => {
    if (!report) return
    downloadReportPdf({ report, filters, selectedFloorLabel })
  }

  return (
    <main className="admin-main admin-main--reports">
      <header className="admin-main__header">
        <div>
          <h1>REPORTES Y ANALITICA</h1>
        </div>
        <div className="admin-main__actions">
          <button
            type="button"
            className="admin-btn-export admin-btn-export--primary"
            onClick={handleExportPdf}
            disabled={!report || loading}
          >
            <AdminIcon name="download" />
            Exportar PDF
          </button>
        </div>
      </header>

      <section className="admin-filterbar admin-filterbar--reports">
        <div className="admin-datepicker">
          <CustomDatePicker
            value={filters.fechaInicio}
            onChange={(value) => updateFilter('fechaInicio', value)}
            min={minReportDate}
            max={filters.fechaFin}
          />
        </div>
        <span className="admin-filterbar__arrow">→</span>
        <div className="admin-datepicker">
          <CustomDatePicker
            value={filters.fechaFin}
            onChange={(value) => updateFilter('fechaFin', value)}
            min={filters.fechaInicio}
          />
        </div>
        <select
          className="admin-select"
          value={filters.pisoId}
          onChange={(event) => updateFilter('pisoId', event.target.value)}
        >
          <option value="todos">Todos los pisos</option>
          {(report?.catalogs?.pisos || []).map((piso) => (
            <option key={piso.PisoID} value={piso.PisoID}>{piso.Nombre}</option>
          ))}
        </select>
        <select
          className="admin-select"
          value={filters.tipo}
          onChange={(event) => updateFilter('tipo', event.target.value)}
        >
          <option value="todos">Tipo: Todos</option>
          {(report?.catalogs?.tipos || []).map((tipo) => (
            <option key={tipo} value={tipo}>Tipo: {tipo}</option>
          ))}
        </select>
      </section>

      {error && <p className="admin-table-msg admin-table-msg--error">{error}</p>}

      <section className="admin-reports-layout">
        <article className="admin-card admin-card--average">
          <div className="admin-card__header">
            <h2>Ocupacion Promedio</h2>
            <div className="admin-segmented" aria-label="Rango de tiempo">
              {RANGE_MODES.map((mode) => {
                const disponible = modeDisponible(mode)
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={!disponible}
                    title={disponible ? undefined : 'El rango de fechas es demasiado largo para esta vista'}
                    className={rangeMode === mode ? 'is-active' : ''}
                    onClick={() => setRangeMode(mode)}
                  >
                    {mode[0].toUpperCase() + mode.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="admin-scatter">
            {loading ? (
              <div className="admin-empty-state">Cargando ocupacion...</div>
            ) : ocupacionData.length > 0 ? (
              <>
                {[domainMax, (domainMin + domainMax) / 2, domainMin].map((v, i) => (
                  <div
                    key={`grid-${i}`}
                    className="admin-scatter__gridline"
                    style={{ top: `${yForValue(v)}%` }}
                  >
                    <span>{Math.round(v)}%</span>
                  </div>
                ))}
                {ocupacionData.map((item, index) => {
                  // Mismo eje X que los labels: el centro de la celda i del
                  // grid de abajo, para que cada punto caiga sobre su label.
                  const left = ((index + 0.5) / ocupacionData.length) * 100
                  const top = yForValue(clampPercent(item.value))
                  return (
                    <span
                      key={`${item.label}-${index}`}
                      className="admin-scatter__point"
                      title={`${item.label}: ${formatPercent(item.value)}`}
                      style={{ left: `${left}%`, top: `${top}%` }}
                    />
                  )
                })}
                <div
                  className="admin-scatter__labels"
                  style={{ gridTemplateColumns: `repeat(${ocupacionData.length}, minmax(0, 1fr))` }}
                >
                  {ocupacionData.map((item, index) => (
                    <span key={`${item.label}-${index}`}>{item.label}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="admin-empty-state">Sin reservaciones en el periodo</div>
            )}
          </div>
        </article>

        <article className="admin-card admin-card--no-shows">
          <div className="admin-card__header">
            <h2>Tasa de No-Shows</h2>
          </div>
          <strong className="admin-no-show__value">
            {loading ? '...' : formatPercent(report?.summary?.noShowRate)}
          </strong>
          <p className={`admin-no-show__trend ${noShowDelta > 0 ? 'is-up' : ''}`}>
            {loading ? 'calculando periodo...' : noShowTrendText}
          </p>
          <p className="admin-no-show__detail">
            {report?.summary?.noShows ?? 0} no-shows de {report?.summary?.totalReservas ?? 0} reservas
          </p>
          <div className="admin-no-show__floors">
            <span>Por piso:</span>
            {(report?.noShowsPorPiso || []).length > 0 ? (
              report.noShowsPorPiso.map((item) => (
                <div key={item.piso}>
                  <small>{item.piso}</small>
                  <i style={{ width: `${Math.max(8, (item.noShows / maxNoShows) * 100)}%` }} />
                </div>
              ))
            ) : (
              <small>Sin no-shows en el periodo</small>
            )}
          </div>
        </article>

        <article className="admin-card admin-card--demand">
          <div className="admin-card__header">
            <h2>Horarios de Mayor Demanda</h2>
          </div>
          <div className="admin-demand-chart">
            {(report?.demandaHoras || []).length > 0 ? (
              report.demandaHoras.map((item) => (
                <div key={item.hora} className="admin-demand-chart__row">
                  <span>{item.hora}</span>
                  <i style={{ width: `${Math.max(8, (item.total / maxDemand) * 100)}%` }} />
                  <strong>{item.total}</strong>
                </div>
              ))
            ) : (
              <div className="admin-empty-state admin-empty-state--compact">
                {loading ? 'Cargando demanda...' : 'Sin demanda en el periodo'}
              </div>
            )}
          </div>
        </article>

        <article className="admin-card admin-card--zones-used">
          <div className="admin-card__header">
            <h2>Zonas Mas / Menos Utilizadas</h2>
          </div>
          <div className="admin-zone-table">
            <div className="admin-zone-table__head">
              <span>Zona</span>
              <span>Piso</span>
              <span>%</span>
            </div>
            {(report?.zonasUso || []).length > 0 ? (
              report.zonasUso.map((zone) => (
                <div key={`${zone.zona}-${zone.piso}`} className="admin-zone-table__row">
                  <span>{zone.zona}</span>
                  <span>{zone.piso}</span>
                  <strong className={zone.percentage >= 50 ? 'is-hot' : 'is-mint'}>
                    {formatPercent(zone.percentage)}
                  </strong>
                </div>
              ))
            ) : (
              <div className="admin-empty-state admin-empty-state--compact">
                {loading ? 'Cargando zonas...' : 'Sin uso registrado'}
              </div>
            )}
          </div>
        </article>
      </section>

    </main>
  )
}

function EspaciosView() {
  const [espacios, setEspacios] = useState([])
  const [pisos, setPisos] = useState([])
  const [loadingPisos, setLoadingPisos] = useState(true)
  const [loadingEspacios, setLoadingEspacios] = useState(false)
  const [error, setError] = useState(null)
  
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroPiso, setFiltroPiso] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ Nombre: '', Tipo: 'Escritorio', PisoID: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const cargarPisos = async () => {
    setLoadingPisos(true)
    setError(null)
    try {
      const resPisos = await getPisos()
      setPisos(resPisos.data || [])
      if (resPisos.data?.length > 0 && !form.PisoID) {
        const pisoFuncional = resPisos.data.find((p) => p.PisoID === PISO_ADMIN_FUNCIONAL_ID)
        setForm(f => ({ ...f, PisoID: String(pisoFuncional?.PisoID || resPisos.data[0].PisoID) }))
      }
    } catch (err) {
      setError('No se pudieron cargar los pisos')
    } finally {
      setLoadingPisos(false)
    }
  }

  const cargarEspacios = async (pisoId = filtroPiso) => {
    if (!pisoId) {
      setEspacios([])
      return
    }
    setLoadingEspacios(true)
    setError(null)
    try {
      const resEspacios = await getAllEspacios(pisoId)
      setEspacios(resEspacios.data || [])
    } catch (err) {
      setError('No se pudieron cargar los espacios')
    } finally {
      setLoadingEspacios(false)
    }
  }

  useEffect(() => { cargarPisos() }, [])

  useEffect(() => {
    cargarEspacios(filtroPiso)
  }, [filtroPiso])

  const filtrados = espacios.filter(e => {
    const nombre = (e.Nombre || '').toLowerCase()
    const id = String(e.EspacioID).toLowerCase()
    const matchSearch = nombre.includes(search.toLowerCase()) || id.includes(search.toLowerCase())
    const matchTipo = filtroTipo === 'todos' || e.Tipo === filtroTipo
    const matchPiso = String(e.PisoID) === filtroPiso
    const matchEstado = filtroEstado === 'todos' || (e.Estado || 'Activo') === filtroEstado
    return matchSearch && matchTipo && matchPiso && matchEstado
  })

  const [page, setPage] = useState(1)
  // Reset a la página 1 cuando cambian los filtros (patrón "ajustar estado
  // en render" de React, en vez de un efecto).
  const filterKey = `${search}|${filtroTipo}|${filtroPiso}|${filtroEstado}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(filtrados.length / ADMIN_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginados = filtrados.slice((currentPage - 1) * ADMIN_PAGE_SIZE, currentPage * ADMIN_PAGE_SIZE)

  const handleFormChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    if (!form.Nombre || !form.Tipo || !form.PisoID) {
      setFormError('Completa todos los campos')
      return
    }
    setSaving(true)
    try {
      await createEspacio(form)
      setShowModal(false)
      setForm(f => ({ ...f, Nombre: '' }))
      if (String(form.PisoID) === filtroPiso) cargarEspacios()
    } catch (err) {
      setFormError(err?.error || 'Error al crear espacio')
    } finally {
      setSaving(false)
    }
  }

  const toggleEstado = async (espacio) => {
    const estadoActual = espacio.Estado || 'Activo'
    const nuevoEstado = estadoActual === 'Activo' ? 'Bloqueado' : 'Activo'
    try {
      const res = await updateEspacioEstado(espacio.EspacioID, nuevoEstado)
      const estadoGuardado = res?.data?.Estado || nuevoEstado
      setEspacios(espacios.map(e => e.EspacioID === espacio.EspacioID ? { ...e, Estado: estadoGuardado } : e))
      await cargarEspacios()
    } catch (err) {
      alert(err?.error || 'Error al actualizar estado')
    }
  }

  const tiposUnicos = [...new Set(espacios.map(e => e.Tipo))].filter(Boolean)

  return (
    <main className="admin-main admin-main--management">
      <header className="admin-main__header">
        <div>
          <h1>GESTION DE ESPACIOS</h1>
        </div>
      </header>

      <section className="admin-management-tools admin-management-tools--spaces">
        <label className="admin-search">
          <AdminIcon name="search" />
          <input type="search" placeholder="Buscar por ID o nombre..." value={search} onChange={e => setSearch(e.target.value)} />
        </label>
        <select className="admin-select" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="todos">Tipo: Todos</option>
          {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="admin-select" value={filtroPiso} onChange={e => setFiltroPiso(e.target.value)}>
          <option value="">{loadingPisos ? 'Cargando pisos...' : 'Selecciona piso'}</option>
          {pisos.map(p => (
            <option key={p.PisoID} value={String(p.PisoID)}>
              {p.Nombre}
            </option>
          ))}
        </select>
        <select className="admin-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="todos">Estado: Todos</option>
          <option value="Activo">Activo</option>
          <option value="Bloqueado">Bloqueado</option>
        </select>
      </section>

      <section className="admin-card admin-card--management-table">
        {!filtroPiso && !loadingPisos && <p className="admin-table-msg">Selecciona un piso para ver sus espacios.</p>}
        {loadingEspacios && <p className="admin-table-msg">Cargando espacios…</p>}
        {error && <p className="admin-table-msg admin-table-msg--error">{error}</p>}
        {filtroPiso && !loadingEspacios && !error && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Piso</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((e) => {
                  const estadoActual = e.Estado || 'Activo';
                  return (
                    <tr key={e.EspacioID}>
                      <td className="admin-table__id">E-{e.EspacioID}</td>
                      <td>{e.Nombre}</td>
                      <td>{e.Tipo}</td>
                      <td>{e.PisoNombre || `Piso ${e.PisoID}`}</td>
                      <td>
                        <span className={`admin-badge ${
                          estadoActual === 'Activo' ? 'admin-badge--ok' : 'admin-badge--rose'
                        }`}>{estadoActual}</span>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button type="button" className={estadoActual === 'Activo' ? 'admin-btn-danger-sm' : 'admin-btn-ghost-sm'} onClick={() => toggleEstado(e)}>
                            {estadoActual === 'Activo' ? 'Bloquear' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtrados.length === 0 && (
                  <tr><td colSpan={6} className="admin-table-msg">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {filtroPiso && !loadingEspacios && !error && (
          <AdminPagination
            page={currentPage}
            filteredTotal={filtrados.length}
            total={espacios.length}
            onPage={setPage}
            noun="espacios"
          />
        )}
      </section>

      {/* ── Modal Agregar Espacio ── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Agregar Espacio</h2>
              <button type="button" className="admin-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form className="admin-modal__form" onSubmit={handleSubmit}>
              <label className="admin-modal__label">
                Nombre del espacio
                <input className="admin-modal__input" name="Nombre" value={form.Nombre} onChange={handleFormChange} placeholder="Ej. Escritorio 42" />
              </label>
              <label className="admin-modal__label">
                Tipo
                <select className="admin-modal__input" name="Tipo" value={form.Tipo} onChange={handleFormChange}>
                  <option value="Escritorio">Escritorio</option>
                  <option value="Sala">Sala</option>
                  <option value="Estacionamiento">Estacionamiento</option>
                </select>
              </label>
              <label className="admin-modal__label">
                Piso
                <select className="admin-modal__input" name="PisoID" value={form.PisoID} onChange={handleFormChange}>
                  {pisos.map(p => (
                    <option key={p.PisoID} value={String(p.PisoID)} disabled={p.PisoID !== PISO_ADMIN_FUNCIONAL_ID}>
                      {p.Nombre}{p.PisoID === PISO_ADMIN_FUNCIONAL_ID ? '' : ' — Próximamente'}
                    </option>
                  ))}
                </select>
              </label>
              {formError && <p className="admin-modal__error" style={{ color: '#ff3246', fontSize: '0.85rem' }}>{formError}</p>}
              <div className="admin-modal__actions">
                <button type="button" className="admin-btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Espacio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  )
}

function UsuariosView() {
  const { user } = useAuth()
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [roles, setRoles] = useState([])

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ Nombre: '', Correo: '', Contrasena: '', RolID: '3', NivelID: '1' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const cargarEmpleados = () => {
    setLoading(true)
    getAllEmpleados()
      .then((res) => setEmpleados(res.data || []))
      .catch(() => setError('No se pudo cargar la lista de empleados'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarEmpleados() }, [])
  useEffect(() => {
    getRoles().then((res) => setRoles(res.data || [])).catch(() => {})
  }, [])

  // Nombre del rol leído de la BD (tabla ROL), no hardcodeado.
  const rolNombre = (rolId) => roles.find((r) => Number(r.RolID) === Number(rolId))?.Nombre || `Rol ${rolId}`

  const filtrados = empleados.filter((u) => {
    const nombre = (u.Nombre || '').toLowerCase()
    const correo = (u.Correo || '').toLowerCase()
    const coincideBusqueda = nombre.includes(search.toLowerCase()) || correo.includes(search.toLowerCase())
    const coincideRol = filtroRol === 'todos' || String(u.RolID) === filtroRol
    return coincideBusqueda && coincideRol
  })

  const [page, setPage] = useState(1)
  const filterKey = `${search}|${filtroRol}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(filtrados.length / ADMIN_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginados = filtrados.slice((currentPage - 1) * ADMIN_PAGE_SIZE, currentPage * ADMIN_PAGE_SIZE)

  const handleFormChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    if (!form.Nombre || !form.Correo || !form.Contrasena) {
      setFormError('Nombre, Correo y Contraseña son obligatorios')
      return
    }
    setSaving(true)
    try {
      await createEmpleado({ ...form, RolID: Number(form.RolID), NivelID: Number(form.NivelID) })
      setShowModal(false)
      setForm({ Nombre: '', Correo: '', Contrasena: '', RolID: '3', NivelID: '1' })
      cargarEmpleados()
    } catch (err) {
      setFormError(err?.error || 'Error al crear el usuario')
    } finally {
      setSaving(false)
    }
  }

  const openDeleteModal = (empleado) => {
    setUserToDelete(empleado)
    setDeleteError(null)
  }

  const closeDeleteModal = () => {
    if (deleting) return
    setUserToDelete(null)
    setDeleteError(null)
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteEmpleado(userToDelete.EmpleadoID)
      setEmpleados((actuales) => actuales.filter((u) => u.EmpleadoID !== userToDelete.EmpleadoID))
      setUserToDelete(null)
    } catch (err) {
      setDeleteError(err?.error || 'No se pudo dar de baja al usuario')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="admin-main admin-main--management">
      <header className="admin-main__header">
        <div>
          <h1>GESTION DE USUARIOS</h1>
        </div>
        <div className="admin-main__actions">
          <button type="button" className="admin-btn-export admin-btn-export--primary" onClick={() => setShowModal(true)}>
            <AdminIcon name="plusBox" />
            Agregar Usuario
          </button>
        </div>
      </header>

      <section className="admin-management-tools admin-management-tools--users">
        <label className="admin-search">
          <AdminIcon name="search" />
          <input
            type="search"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select className="admin-select" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="todos">Rol: Todos</option>
          {roles.map((r) => (
            <option key={r.RolID} value={String(r.RolID)}>{r.Nombre}</option>
          ))}
        </select>
      </section>

      <section className="admin-card admin-card--management-table">
        {loading && <p className="admin-table-msg">Cargando empleados…</p>}
        {error && <p className="admin-table-msg admin-table-msg--error">{error}</p>}
        {!loading && !error && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Puntos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((u) => (
                  <tr key={u.EmpleadoID}>
                    <td className="admin-table__id">U-{u.EmpleadoID}</td>
                    <td>{u.Nombre}</td>
                    <td style={{ color: 'var(--admin-muted)', fontSize: '0.88rem' }}>{u.Correo}</td>
                    <td>
                      <span className={`admin-badge ${
                        u.RolID === 1 ? 'admin-badge--tipo' :
                        u.RolID === 2 ? 'admin-badge--yellow' :
                        'admin-badge--ok'
                      }`}>
                        {rolNombre(u.RolID)}
                      </span>
                    </td>
                    <td>{u.Puntos ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn-danger-sm admin-btn-danger-sm--icon"
                        onClick={() => openDeleteModal(u)}
                        disabled={String(user?.empleadoId) === String(u.EmpleadoID)}
                        title={String(user?.empleadoId) === String(u.EmpleadoID) ? 'No puedes darte de baja a ti mismo' : 'Eliminar usuario'}
                        aria-label={`Eliminar usuario ${u.Nombre}`}
                      >
                        <AdminIcon name="trash" />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr><td colSpan={6} className="admin-table-msg">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && (
          <AdminPagination
            page={currentPage}
            filteredTotal={filtrados.length}
            total={empleados.length}
            onPage={setPage}
            noun="empleados"
          />
        )}
      </section>

      {/* ── Modal Agregar Usuario ── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Agregar Usuario</h2>
              <button type="button" className="admin-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form className="admin-modal__form" onSubmit={handleSubmit}>
              <label className="admin-modal__label">
                Nombre completo
                <input className="admin-modal__input" name="Nombre" value={form.Nombre} onChange={handleFormChange} placeholder="Ej. Juan Pérez" />
              </label>
              <label className="admin-modal__label">
                Correo electrónico
                <input className="admin-modal__input" type="email" name="Correo" value={form.Correo} onChange={handleFormChange} placeholder="correo@accenture.com" />
              </label>
              <label className="admin-modal__label">
                Contraseña
                <input className="admin-modal__input" type="password" name="Contrasena" value={form.Contrasena} onChange={handleFormChange} placeholder="••••••••" />
              </label>
              <label className="admin-modal__label">
                Rol
                <select className="admin-modal__input admin-modal__select" name="RolID" value={form.RolID} onChange={handleFormChange}>
                  {roles.map((r) => (
                    <option key={r.RolID} value={String(r.RolID)}>{r.Nombre}</option>
                  ))}
                </select>
              </label>
              {formError && <p className="admin-modal__error">{formError}</p>}
              <div className="admin-modal__actions">
                <button type="button" className="admin-btn-export" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="admin-btn-export admin-btn-export--primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="admin-modal-overlay" onClick={closeDeleteModal}>
          <div className="admin-modal admin-modal--confirm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Confirmar baja</h2>
              <button type="button" className="admin-modal__close" onClick={closeDeleteModal} disabled={deleting}>✕</button>
            </div>
            <div className="admin-confirm">
              <p className="admin-confirm__title">¿Estás seguro que quieres dar de baja?</p>
              <p className="admin-confirm__body">
                Se eliminará a <strong>{userToDelete.Nombre}</strong> de la base de datos junto con sus reservaciones y registros relacionados.
              </p>
              {deleteError && <p className="admin-modal__error">{deleteError}</p>}
              <div className="admin-modal__actions">
                <button type="button" className="admin-btn-export" onClick={closeDeleteModal} disabled={deleting}>Cancelar</button>
                <button type="button" className="admin-btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Eliminando…' : 'Dar de baja'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}

// ── Reservas data ────────────────────────────────────────
function VisitasView() {
  const [reservaciones, setReservaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState('todos')
  const [filtroFecha, setFiltroFecha] = useState('')

  useEffect(() => {
    getAllReservaciones()
      .then((res) => {
        const sorted = [...(res.data || [])].sort((a, b) => Number(b.ReservacionID) - Number(a.ReservacionID))
        setReservaciones(sorted)
      })
      .catch(() => setError('No se pudo cargar las reservaciones'))
      .finally(() => setLoading(false))
  }, [])

  const today = toLocalDateInput(new Date())
  const isCanceled = (r) => String(r.EstatusNombre || '').toLowerCase() === 'cancelada'
  const getFechaSql = (fecha) => fecha ? String(fecha).slice(0, 10) : ''

  const hoy = reservaciones.filter((r) => {
    const fecha = getFechaSql(r.Fecha)
    return fecha === today
  })

  const programadas = hoy.filter((r) => !isCanceled(r)).length
  const activas = hoy.filter((r) => r.EstatusNombre === 'Activa').length
  const proximos = reservaciones.filter((r) => {
    const fecha = getFechaSql(r.Fecha)
    return fecha > today && !isCanceled(r)
  }).length
  const estatusOptions = [...new Set(reservaciones.map((r) => r.EstatusNombre).filter(Boolean))]

  const filtradas = reservaciones
    .filter((r) => {
      const fechaR = getFechaSql(r.Fecha)
      const term = search.trim().toLowerCase()
      const id = `r-${r.ReservacionID}`.toLowerCase()
      const nombre = (r.EmpleadoNombre || '').toLowerCase()
      const espacio = (r.EspacioNombre || '').toLowerCase()
      const piso = (r.PisoNombre || '').toLowerCase()
      const estacionamiento = (r.EstacionamientoNombre || '').toLowerCase()
      const coincide = !term ||
        id.includes(term) ||
        nombre.includes(term) ||
        espacio.includes(term) ||
        piso.includes(term) ||
        estacionamiento.includes(term)
      const coincideEstatus = filtroEstatus === 'todos' || (r.EstatusNombre || '') === filtroEstatus
      const coincideFecha = !filtroFecha || fechaR === filtroFecha
      return coincide && coincideEstatus && coincideFecha
    })
    .sort((a, b) => Number(b.ReservacionID) - Number(a.ReservacionID))

  const [page, setPage] = useState(1)
  const filterKey = `${search}|${filtroEstatus}|${filtroFecha}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(filtradas.length / ADMIN_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginadas = filtradas.slice((currentPage - 1) * ADMIN_PAGE_SIZE, currentPage * ADMIN_PAGE_SIZE)

  const fmtHora = (h) => (h ? String(h).slice(0, 5) : '—')
  const fmtFecha = (f) => {
    if (!f) return '—'
    const [year, month, day] = String(f).slice(0, 10).split('-')
    return `${day}/${month}/${String(year).slice(2)}`
  }

  return (
    <main className="admin-main admin-main--management">
      <header className="admin-main__header">
        <div>
          <h1>GESTIÓN DE RESERVAS</h1>
        </div>
      </header>

      <section className="admin-visitas-stats">
        <article className="admin-visitas-stat">
          <span className="admin-visitas-stat__label">Reservaciones del dia</span>
          <strong className="admin-visitas-stat__value" style={{ color: '#f5efff' }}>{loading ? '…' : programadas}</strong>
        </article>
        <article className="admin-visitas-stat">
          <span className="admin-visitas-stat__label">Activas en Sitio</span>
          <strong className="admin-visitas-stat__value" style={{ color: '#12e0a4' }}>{loading ? '…' : activas}</strong>
        </article>
        <article className="admin-visitas-stat">
          <span className="admin-visitas-stat__label">Próximos Días</span>
          <strong className="admin-visitas-stat__value" style={{ color: '#b100ff' }}>{loading ? '…' : proximos}</strong>
        </article>
      </section>

      <section className="admin-management-tools" style={{ marginTop: '1.4rem', gridTemplateColumns: 'minmax(200px, 1fr) 150px 160px' }}>
        <label className="admin-search" style={{ flex: 1 }}>
          <AdminIcon name="search" />
          <input
            type="search"
            placeholder="Buscar por ID, empleado, espacio o piso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <input
          type="date"
          className="admin-select admin-select--date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
        />
        <select className="admin-select" value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)}>
          <option value="todos">Estado: Todos</option>
          {estatusOptions.map((estatus) => (
            <option key={estatus} value={estatus}>{estatus}</option>
          ))}
        </select>
      </section>

      <section className="admin-card admin-card--management-table" style={{ marginTop: '1rem' }}>
        {loading && <p className="admin-table-msg">Cargando reservaciones…</p>}
        {error && <p className="admin-table-msg admin-table-msg--error">{error}</p>}
        {!loading && !error && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Empleado</th>
                  <th>Espacio</th>
                  <th>Fecha</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {paginadas.map((r) => (
                  <tr key={r.ReservacionID}>
                    <td className="admin-table__id">R-{r.ReservacionID}</td>
                    <td>{r.EmpleadoNombre || '—'}</td>
                    <td>{r.EspacioNombre || r.EstacionamientoNombre || '—'}</td>
                    <td>{fmtFecha(r.Fecha)}</td>
                    <td className="admin-table__mint">{fmtHora(r.HoraInicio)}</td>
                    <td>{fmtHora(r.HoraFin)}</td>
                    <td>
                      <span className={`admin-badge ${
                        r.EstatusNombre === 'Activa' ? 'admin-badge--ok' :
                        r.EstatusNombre === 'Cancelada' ? 'admin-badge--rose' :
                        'admin-badge--arch'
                      }`}>
                        {r.EstatusNombre === 'Activa' && <span className="admin-badge__dot" />}
                        {r.EstatusNombre || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtradas.length === 0 && (
                  <tr><td colSpan={7} className="admin-table-msg">Sin reservaciones con esos filtros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && (
          <AdminPagination
            page={currentPage}
            filteredTotal={filtradas.length}
            total={reservaciones.length}
            onPage={setPage}
            noun="reservaciones"
          />
        )}
      </section>

    </main>
  )
}

// ── Eventos (bloqueo masivo de espacios) ──────────────────
function EventosView() {
  const [eventos, setEventos] = useState([])
  const [pisos, setPisos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  // Modal crear
  const [showModal, setShowModal] = useState(false)
  const hoyStr = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    Nombre: '',
    Motivo: '',
    FechaInicio: hoyStr,
    FechaFin: hoyStr,
    todoElDia: true,
    HoraInicio: '09:00',
    HoraFin: '14:00',
    PisoID: String(PISO_ADMIN_FUNCIONAL_ID),
    bloquearPisoCompleto: true,
    EspacioIDs: [],
  })
  const [espaciosPiso, setEspaciosPiso] = useState([])
  const [loadingEspacios, setLoadingEspacios] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  // Eliminar
  const [eventoToDelete, setEventoToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const cargarEventos = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getEventos()
      setEventos(res.data || [])
    } catch {
      setError('No se pudieron cargar los eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarEventos() }, [])
  useEffect(() => { getPisos().then((res) => setPisos(res.data || [])).catch(() => {}) }, [])

  // Cuando NO se bloquea el piso completo, cargamos sus espacios para elegir.
  useEffect(() => {
    if (form.bloquearPisoCompleto || !form.PisoID) {
      setEspaciosPiso([])
      return
    }
    setLoadingEspacios(true)
    getAllEspacios(form.PisoID)
      .then((res) => setEspaciosPiso(res.data || []))
      .catch(() => setEspaciosPiso([]))
      .finally(() => setLoadingEspacios(false))
  }, [form.PisoID, form.bloquearPisoCompleto])

  const today = new Date().toISOString().slice(0, 10)
  const totalEspacios = eventos.reduce((acc, e) => acc + Number(e.EspaciosBloqueados || 0), 0)
  const vigentes = eventos.filter((e) => e.Estatus !== 'Cancelado' && (e.FechaFin ? String(e.FechaFin).slice(0, 10) >= today : false)).length

  // Estado mostrado: Cancelado (borrado lógico), Finalizado (su fecha fin ya
  // pasó) o Activo (vigente). Finalizado/Activo se derivan, no se guardan.
  const estadoEvento = (e) => {
    if (e.Estatus === 'Cancelado') return 'Cancelado'
    if (e.FechaFin && String(e.FechaFin).slice(0, 10) < today) return 'Finalizado'
    return 'Activo'
  }

  const filtrados = eventos.filter((e) => {
    const nombre = (e.Nombre || '').toLowerCase()
    const motivo = (e.Motivo || '').toLowerCase()
    return nombre.includes(search.toLowerCase()) || motivo.includes(search.toLowerCase())
  })

  const [page, setPage] = useState(1)
  const [prevSearch, setPrevSearch] = useState(search)
  if (search !== prevSearch) {
    setPrevSearch(search)
    setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(filtrados.length / ADMIN_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginados = filtrados.slice((currentPage - 1) * ADMIN_PAGE_SIZE, currentPage * ADMIN_PAGE_SIZE)

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const toggleEspacio = (espacioId) => {
    setForm((f) => {
      const exists = f.EspacioIDs.includes(espacioId)
      return {
        ...f,
        EspacioIDs: exists ? f.EspacioIDs.filter((id) => id !== espacioId) : [...f.EspacioIDs, espacioId],
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    if (!form.Nombre || !form.FechaInicio || !form.FechaFin) {
      setFormError('Nombre, fecha de inicio y fecha de fin son obligatorios')
      return
    }
    if (form.FechaFin < form.FechaInicio) {
      setFormError('La fecha de fin no puede ser anterior a la de inicio')
      return
    }
    if (!form.bloquearPisoCompleto && form.EspacioIDs.length === 0) {
      setFormError('Selecciona al menos un espacio o activa "Bloquear piso completo"')
      return
    }
    setSaving(true)
    try {
      await createEvento({
        Nombre: form.Nombre,
        Motivo: form.Motivo || null,
        FechaInicio: form.FechaInicio,
        FechaFin: form.FechaFin,
        HoraInicio: form.todoElDia ? null : form.HoraInicio,
        HoraFin: form.todoElDia ? null : form.HoraFin,
        PisoID: form.bloquearPisoCompleto ? Number(form.PisoID) : undefined,
        EspacioIDs: form.bloquearPisoCompleto ? undefined : form.EspacioIDs,
      })
      setShowModal(false)
      setForm((f) => ({ ...f, Nombre: '', Motivo: '', EspacioIDs: [] }))
      await cargarEventos()
    } catch (err) {
      setFormError(err?.error || 'Error al crear el evento')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!eventoToDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteEvento(eventoToDelete.EventoID)
      setEventoToDelete(null)
      await cargarEventos()
    } catch (err) {
      setDeleteError(err?.error || 'No se pudo cancelar el evento')
    } finally {
      setDeleting(false)
    }
  }

  const fmtFecha = (f) => {
    if (!f) return '—'
    const d = new Date(f)
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`
  }
  const fmtHora = (h) => (h ? String(h).slice(0, 5) : '')

  return (
    <main className="admin-main admin-main--management">
      <header className="admin-main__header">
        <div>
          <h1>GESTIÓN DE EVENTOS</h1>
        </div>
        <div className="admin-main__actions">
          <button type="button" className="admin-btn-export admin-btn-export--primary" onClick={() => setShowModal(true)}>
            <AdminIcon name="plusBox" />
            Nuevo Evento
          </button>
        </div>
      </header>

      <section className="admin-visitas-stats">
        <article className="admin-visitas-stat">
          <span className="admin-visitas-stat__label">Eventos Registrados</span>
          <strong className="admin-visitas-stat__value" style={{ color: '#f5efff' }}>{loading ? '…' : eventos.length}</strong>
        </article>
        <article className="admin-visitas-stat">
          <span className="admin-visitas-stat__label">Vigentes / Próximos</span>
          <strong className="admin-visitas-stat__value" style={{ color: '#12e0a4' }}>{loading ? '…' : vigentes}</strong>
        </article>
        <article className="admin-visitas-stat">
          <span className="admin-visitas-stat__label">Espacios Bloqueados</span>
          <strong className="admin-visitas-stat__value" style={{ color: '#b100ff' }}>{loading ? '…' : totalEspacios}</strong>
        </article>
      </section>

      <section className="admin-management-tools" style={{ marginTop: '1.4rem' }}>
        <label className="admin-search" style={{ flex: 1 }}>
          <AdminIcon name="search" />
          <input
            type="search"
            placeholder="Buscar por nombre o motivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </section>

      <section className="admin-card admin-card--management-table" style={{ marginTop: '1rem' }}>
        {loading && <p className="admin-table-msg">Cargando eventos…</p>}
        {error && <p className="admin-table-msg admin-table-msg--error">{error}</p>}
        {!loading && !error && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Motivo</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Horario</th>
                  <th>Espacios</th>
                  <th>Estatus</th>
                  <th>Organizador</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((e) => {
                  const estado = estadoEvento(e)
                  return (
                  <tr key={e.EventoID}>
                    <td>{e.Nombre}</td>
                    <td style={{ color: 'var(--admin-muted)' }}>{e.Motivo || '—'}</td>
                    <td>{fmtFecha(e.FechaInicio)}</td>
                    <td>{fmtFecha(e.FechaFin)}</td>
                    <td style={{ color: 'var(--admin-muted)', fontSize: '0.82rem' }}>{e.HoraInicio && e.HoraFin ? `${fmtHora(e.HoraInicio)}–${fmtHora(e.HoraFin)}` : 'Todo el día'}</td>
                    <td><span className="admin-badge admin-badge--yellow">{e.EspaciosBloqueados ?? 0}</span></td>
                    <td>
                      <span className={`admin-badge ${estado === 'Activo' ? 'admin-badge--ok' : estado === 'Cancelado' ? 'admin-badge--rose' : 'admin-badge--arch'}`}>{estado}</span>
                    </td>
                    <td style={{ color: 'var(--admin-muted)' }}>{e.OrganizadorNombre || e.EmpleadoID || '—'}</td>
                    <td>
                      {e.Estatus === 'Cancelado' ? (
                        <span style={{ color: 'var(--admin-muted)', fontSize: '0.8rem' }}>—</span>
                      ) : (
                        <button
                          type="button"
                          className="admin-btn-danger-sm admin-btn-danger-sm--icon"
                          onClick={() => { setEventoToDelete(e); setDeleteError(null) }}
                          aria-label={`Cancelar evento ${e.Nombre}`}
                        >
                          <AdminIcon name="trash" />
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                  )
                })}
                {filtrados.length === 0 && (
                  <tr><td colSpan={9} className="admin-table-msg">Sin eventos registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && (
          <AdminPagination
            page={currentPage}
            filteredTotal={filtrados.length}
            total={eventos.length}
            onPage={setPage}
            noun="eventos"
          />
        )}
      </section>

      {/* ── Modal Nuevo Evento ── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ overflow: 'visible' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Nuevo Evento</h2>
              <button type="button" className="admin-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form className="admin-modal__form" onSubmit={handleSubmit}>
              <label className="admin-modal__label">
                Nombre del evento
                <input className="admin-modal__input" name="Nombre" value={form.Nombre} onChange={handleFormChange} placeholder="Ej. Hackathon Q2" />
              </label>
              <label className="admin-modal__label">
                Motivo
                <input className="admin-modal__input" name="Motivo" value={form.Motivo} onChange={handleFormChange} placeholder="Ej. Evento corporativo" />
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <label className="admin-modal__label" style={{ flex: 1 }}>
                  Desde
                  <CustomDatePicker
                    value={form.FechaInicio}
                    min={hoyStr}
                    onChange={(iso) => setForm((f) => ({
                      ...f,
                      FechaInicio: iso,
                      FechaFin: f.FechaFin && f.FechaFin < iso ? iso : f.FechaFin,
                    }))}
                  />
                </label>
                <label className="admin-modal__label" style={{ flex: 1 }}>
                  Hasta
                  <CustomDatePicker
                    value={form.FechaFin}
                    min={form.FechaInicio || hoyStr}
                    onChange={(iso) => setForm((f) => ({ ...f, FechaFin: iso }))}
                  />
                </label>
              </div>
              <label className="admin-check" style={{ marginTop: '0.2rem' }}>
                <input type="checkbox" name="todoElDia" checked={form.todoElDia} onChange={handleFormChange} />
                <span className="admin-check__box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4 10-10" /></svg>
                </span>
                <span className="admin-check__text">Todo el día</span>
              </label>
              {!form.todoElDia && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <label className="admin-modal__label" style={{ flex: 1 }}>
                    Hora inicio
                    <CustomTimePicker
                      value={form.HoraInicio}
                      onChange={(hhmm) => setForm((f) => ({
                        ...f,
                        HoraInicio: hhmm,
                        HoraFin: f.HoraFin <= hhmm ? hhmm : f.HoraFin,
                      }))}
                    />
                  </label>
                  <label className="admin-modal__label" style={{ flex: 1 }}>
                    Hora fin
                    <CustomTimePicker
                      value={form.HoraFin}
                      min={form.HoraInicio}
                      onChange={(hhmm) => setForm((f) => ({ ...f, HoraFin: hhmm }))}
                    />
                  </label>
                </div>
              )}
              <label className="admin-modal__label">
                Piso a bloquear
                <div className="relative">
                  <select
                    name="PisoID"
                    value={form.PisoID}
                    onChange={handleFormChange}
                    className="w-full h-11 px-3 pr-8 rounded-lg bg-surface-badge font-mono text-[13px] text-white border-none outline-none cursor-pointer appearance-none [color-scheme:dark]"
                  >
                    {pisos.map((p) => (
                      <option key={p.PisoID} value={String(p.PisoID)}>
                        {p.Nombre}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">▾</span>
                </div>
              </label>
              <label className="admin-check" style={{ marginTop: '0.2rem' }}>
                <input type="checkbox" name="bloquearPisoCompleto" checked={form.bloquearPisoCompleto} onChange={handleFormChange} />
                <span className="admin-check__box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4 10-10" /></svg>
                </span>
                <span className="admin-check__text">Bloquear piso completo</span>
              </label>

              {!form.bloquearPisoCompleto && (
                <div className="admin-modal__label">
                  Espacios a bloquear {loadingEspacios && '(cargando…)'}
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid rgba(161,0,255,0.25)', borderRadius: '8px', padding: '0.6rem', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem' }}>
                    {espaciosPiso.map((esp) => (
                      <label key={esp.EspacioID} className="admin-check">
                        <input type="checkbox" checked={form.EspacioIDs.includes(esp.EspacioID)} onChange={() => toggleEspacio(esp.EspacioID)} />
                        <span className="admin-check__box">
                          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4 10-10" /></svg>
                        </span>
                        <span className="admin-check__text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{esp.Nombre}</span>
                      </label>
                    ))}
                    {!loadingEspacios && espaciosPiso.length === 0 && <span style={{ color: 'var(--admin-muted)', fontSize: '0.82rem' }}>Sin espacios</span>}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--admin-muted)' }}>{form.EspacioIDs.length} seleccionados</span>
                </div>
              )}

              {formError && <p className="admin-modal__error" style={{ color: '#ff3246', fontSize: '0.85rem' }}>{formError}</p>}
              <div className="admin-modal__actions">
                <button type="button" className="admin-btn-export" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="admin-btn-export admin-btn-export--primary" disabled={saving}>
                  {saving ? 'Creando…' : 'Crear Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Eliminar Evento ── */}
      {eventoToDelete && (
        <div className="admin-modal-overlay" onClick={() => !deleting && setEventoToDelete(null)}>
          <div className="admin-modal admin-modal--confirm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Cancelar evento</h2>
              <button type="button" className="admin-modal__close" onClick={() => !deleting && setEventoToDelete(null)} disabled={deleting}>✕</button>
            </div>
            <div className="admin-confirm">
              <p className="admin-confirm__title">¿Cancelar este evento?</p>
              <p className="admin-confirm__body">
                Se liberarán los {eventoToDelete.EspaciosBloqueados ?? 0} espacio(s) que <strong>{eventoToDelete.Nombre}</strong> tenía bloqueados. El evento se conserva en el historial marcado como <strong>Cancelado</strong>.
              </p>
              {deleteError && <p className="admin-modal__error">{deleteError}</p>}
              <div className="admin-modal__actions">
                <button type="button" className="admin-btn-export" onClick={() => setEventoToDelete(null)} disabled={deleting}>Volver</button>
                <button type="button" className="admin-btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Cancelando…' : 'Cancelar evento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}

export default function AdminDashboardPage() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [roles, setRoles] = useState([])
  const { user } = useAuth()
  const { dashboard, loading, error } = useDashboard()
  const [selectedDashboardFloorId, setSelectedDashboardFloorId] = useState('')

  useEffect(() => {
    getRoles().then((res) => setRoles(res.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const floors = dashboard?.floors || []
    if (floors.length === 0) {
      setSelectedDashboardFloorId('')
      return
    }

    const selectedStillExists = floors.some((floor) => String(floor.pisoId) === String(selectedDashboardFloorId))
    if (!selectedStillExists) {
      setSelectedDashboardFloorId(String(floors[0].pisoId))
    }
  }, [dashboard?.floors, selectedDashboardFloorId])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const isBackendConnected = Boolean(dashboard) && !error
  const hasBackendData = Boolean(dashboard?.hasBackendData)

  const dashboardStats = dashboard?.stats
    ? [
        {
          label: 'Escritorios',
          value: String(dashboard.stats.totalSpaces ?? 0),
          detail: 'total',
          accent: 'admin-stat--violet',
          icon: 'desktop',
        },
        {
          label: 'Ocupados',
          value: String(dashboard.stats.occupiedSpaces ?? 0),
          detail: 'en uso ahora',
          accent: 'admin-stat--rose',
          icon: 'userSquare',
        },
        {
          label: 'Disponibles',
          value: String(dashboard.stats.availableSpaces ?? 0),
          detail: 'libres ahora',
          accent: 'admin-stat--mint',
          icon: 'checkSquare',
        },
        {
          label: 'Cajones',
          value: String(dashboard.stats.parkingTotal ?? 0),
          detail: `${dashboard.stats.parkingOccupied ?? 0} ocupados`,
          accent: 'admin-stat--violet',
          icon: 'car',
        },
        {
          label: '% Ocupacion',
          value: formatPercent(dashboard.stats.occupancyPercent),
          detail: 'en vivo',
          accent: 'admin-stat--outline',
          icon: null,
        },
        {
          label: 'Bloqueados',
          value: String(dashboard.stats.blockedSpaces ?? 0),
          detail: 'mantenimiento',
          accent: 'admin-stat--yellow',
          icon: 'lock',
        },
      ]
    : loading
      ? loadingStats
      : emptyStats

  const dashboardFloorOptions = dashboard?.floors || []
  const selectedDashboardFloor = dashboardFloorOptions.find((floor) => String(floor.pisoId) === String(selectedDashboardFloorId))
    || dashboardFloorOptions[0]
    || null

  const dashboardFloors = dashboardFloorOptions.length
    ? dashboardFloorOptions.map((floor) => ({
        label: floor.label,
        occupied: clampPercent(floor.occupancyPercent),
      }))
    : []

  const dashboardFloorRows = dashboardFloorOptions.length
    ? dashboardFloorOptions.map((floor) => ({
        label: floor.label,
        value: formatPercent(floor.occupancyPercent),
        percent: clampPercent(floor.occupancyPercent),
        accent: String(floor.pisoId) === String(selectedDashboardFloor?.pisoId),
      }))
    : []

  const selectedFloorZones = selectedDashboardFloor
    ? dashboard?.zonesByFloor?.[String(selectedDashboardFloor.pisoId)] || []
    : dashboard?.zones || []
  const dashboardZones = selectedFloorZones.length
    ? selectedFloorZones.map((zone, index) => ({
        label: zone.label,
        value: formatPercent(zone.occupancyPercent ?? zone.value),
        color: zone.color || (index === 0 ? '#a100ff' : index === 1 ? '#16e0a3' : '#ff3355'),
      }))
    : []

  const selectedZoneValue = clampPercent(selectedDashboardFloor?.occupancyPercent || 0)
  const selectedZonePercent = formatPercent(selectedZoneValue)
  const liveStatus = loading
    ? 'Cargando datos...'
    : error
      ? error
      : hasBackendData
        ? 'En vivo - actualizado'
        : 'Conectado - sin registros'
  const liveClassName = `admin-main__live ${error ? 'is-error' : !hasBackendData && !loading ? 'is-warning' : ''}`

  const navigate = useNavigate()
  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand__topline">
            <span className="admin-brand__arrow">›</span>
            <span
              role="button"
              tabIndex={0}
              onClick={() => navigate('/')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
              style={{ cursor: 'pointer' }}
              title="Volver al inicio"
            >accenture</span>
            <span className="admin-brand__slashes">//</span>
            <span className="admin-brand__name">WORKHUB MTY</span>
          </div>
          <div className="admin-brand__badge">ADMIN PANEL</div>
        </div>

        <nav className="admin-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`admin-nav__item ${activePage === item.label ? 'is-active' : ''}`}
              onClick={() => setActivePage(item.label)}
            >
              <span className="admin-nav__icon">
                <AdminIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-user">
          <div className="admin-user__avatar">{user?.initials || '??'}</div>
          <div>
            <strong>{user?.name || 'Usuario'}</strong>
            <span>{
              roles.find((r) => Number(r.RolID) === Number(user?.rolId))?.Nombre || 'Administrador'
            }</span>
          </div>
        </div>
      </aside>

      {activePage === 'Dashboard' && (
      <main className="admin-main">
        <header className="admin-main__header">
          <div>
            <h1>OCUPACION EN TIEMPO REAL</h1>
          </div>
          <div className={liveClassName}>
            <span className="admin-main__dot" />
            <span>{liveStatus}</span>
          </div>
        </header>

        <section className="admin-stats">
          {dashboardStats.map((stat) => (
            <article key={stat.label} className={`admin-stat ${stat.accent}`}>
              <div className="admin-stat__top">
                <span>{stat.label}</span>
                {stat.icon ? <AdminIcon name={stat.icon} /> : null}
              </div>
              <div className="admin-stat__bottom">
                <strong>{stat.value}</strong>
                <span>{stat.detail}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="admin-grid">
          <article className="admin-card admin-card--floors">
            <div className="admin-card__header">
              <h2>Ocupacion por Piso</h2>
              <span className="admin-pill">hoy</span>
            </div>

            <div className="admin-bars">
              {dashboardFloors.length > 0 ? (
                dashboardFloors.map((floor) => (
                  <div key={floor.label} className="admin-bars__item" title={floor.label}>
                    <div className="admin-bars__track">
                      <div
                        className="admin-bars__available"
                        style={{ height: `${100 - floor.occupied}%` }}
                      />
                      <div
                        className="admin-bars__occupied"
                        style={{ height: `${floor.occupied}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-empty-state">
                  {loading ? 'Cargando pisos...' : 'Sin pisos para mostrar'}
                </div>
              )}
            </div>

            <div className="admin-floor-list">
              {dashboardFloorRows.length > 0 ? (
                dashboardFloorRows.map((floor) => (
                  <div key={floor.label} className="admin-floor-list__row">
                    <span>{floor.label}</span>
                    <div className="admin-floor-list__bar">
                      <div
                        className="admin-floor-list__bar-fill"
                        style={{ width: `${floor.percent}%` }}
                      />
                    </div>
                    <strong className={floor.accent ? 'is-accent' : ''}>{floor.value}</strong>
                  </div>
                ))
              ) : (
                <div className="admin-empty-state admin-empty-state--compact">
                  {loading ? 'Cargando pisos...' : 'Sin pisos para mostrar'}
                </div>
              )}
            </div>
          </article>

          <article className="admin-card admin-card--zones">
            <div className="admin-card__header admin-card__header--zones">
              <div>
                <h2>Ocupacion por Zona</h2>
                <span>{selectedDashboardFloor ? `${selectedDashboardFloor.label} seleccionado` : 'Selecciona un piso'}</span>
              </div>
              <select
                className="admin-select admin-select--floor"
                value={selectedDashboardFloor?.pisoId ? String(selectedDashboardFloor.pisoId) : ''}
                onChange={(event) => setSelectedDashboardFloorId(event.target.value)}
                disabled={dashboardFloorOptions.length === 0}
              >
                {dashboardFloorOptions.map((floor) => (
                  <option key={floor.pisoId} value={floor.pisoId}>{floor.label}</option>
                ))}
              </select>
            </div>

            <div className="admin-donut">
              <div
                className="admin-donut__chart"
                style={{ '--admin-donut-value': `${selectedZoneValue}%` }}
              >
                <div className="admin-donut__inner">{selectedZonePercent}</div>
              </div>
            </div>

            <div className="admin-legend">
              {dashboardZones.length > 0 ? (
                dashboardZones.map((zone) => (
                  <div key={zone.label} className="admin-legend__item">
                    <span className="admin-legend__dot" style={{ backgroundColor: zone.color }} />
                    <span>{zone.label}: {zone.value}</span>
                  </div>
                ))
              ) : (
                <div className="admin-empty-state admin-empty-state--compact">
                  {loading ? 'Cargando zonas...' : 'Sin zonas del backend'}
                </div>
              )}
            </div>
          </article>
        </section>

      </main>
      )}
      {activePage === 'Reportes' && <ReportesView />}
      {activePage === 'Espacios' && <EspaciosView />}
      {activePage === 'Usuarios' && <UsuariosView />}
      {activePage === 'Reservas' && <VisitasView />}
      {activePage === 'Eventos' && <EventosView />}
    </div>
  )
}
