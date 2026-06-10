function normalizeName(nombre) {
  return String(nombre || '').trim().toUpperCase()
}

export function mapEstadoToStatus(espacio) {
  const status = String(espacio?.status || '').trim().toLowerCase()
  if (status === 'blocked' || status === 'occupied' || status === 'available') {
    return status
  }
  const estado = String(espacio?.Estado || '').trim().toLowerCase()
  if (['bloqueado', 'blocked'].includes(estado)) return 'blocked'
  if (['ocupado', 'reservado', 'no disponible', 'indisponible', 'inactivo'].includes(estado)) return 'occupied'
  return 'available'
}

export function dedupeEspacios(espacios) {
  const byId = new Map()
  for (const e of espacios || []) {
    const prev = byId.get(e.EspacioID)
    if (!prev || (mapEstadoToStatus(prev) === 'available' && mapEstadoToStatus(e) !== 'available')) {
      byId.set(e.EspacioID, e)
    }
  }
  return [...byId.values()]
}

export function mapEspaciosToDesks(espacios) {
  return (espacios || [])
    .filter((e) => {
      const name = normalizeName(e.Nombre)
      const tipo = String(e.Tipo || '').trim().toLowerCase()
      const isDeskType = ['oficina', 'escritorio', 'desk', 'office'].includes(tipo)
      const isDeskName = /^IC3\d+$/i.test(name) || /^PB0?\d{1,4}$/i.test(name) || /^MZ\d+$/i.test(name) || /^\d{3,4}$/.test(name)
      return isDeskType || isDeskName
    })
    .map((e) => {
      const name = String(e.Nombre || '').trim()
      return {
        id: name,
        espacioID: e.EspacioID,
        cluster: getCluster(name),
        status: mapEstadoToStatus(e),
      }
    })
}

export function mapEspaciosToSalas(espacios) {
  return (espacios || [])
    .filter((e) => String(e.Tipo || '').trim().toLowerCase() === 'sala')
    .map((e) => ({
      id: String(e.Nombre || '').trim(),
      espacioID: e.EspacioID,
      status: mapEstadoToStatus(e),
    }))
}

export function getCluster(nombre) {
  const normalized = normalizeName(nombre)
  const num = parseInt(normalized.replace(/\D/g, ''), 10)

  if (normalized.startsWith('MZ')) {
    if (num >= 1 && num <= 6) return 'MZ01_MZ06'
    if (num >= 7 && num <= 16) return 'MZ07_MZ16'
    if (num >= 17 && num <= 21) return 'MZ17_MZ21'
    if (num >= 22 && num <= 29) return 'MZ22_MZ29'
    if (num >= 30 && num <= 33) return 'MZ30_MZ33'
    if (num >= 34 && num <= 41) return 'MZ34_MZ41'
    if (num >= 42 && num <= 49) return 'MZ42_MZ49'
    if (num >= 50 && num <= 57) return 'MZ50_MZ57'
    if (num >= 58 && num <= 65) return 'MZ58_MZ65'
    if (num >= 66 && num <= 73) return 'MZ66_MZ73'
    if (num >= 74 && num <= 81) return 'MZ74_MZ81'
    if (num >= 82 && num <= 85) return 'MZ82_MZ85'
    if (num >= 86 && num <= 93) return 'MZ86_MZ93'
    if (num >= 94 && num <= 98) return 'MZ94_MZ98'
    if (num >= 99 && num <= 104) return 'MZ99_MZ104'
    if (num >= 105 && num <= 114) return 'MZ105_MZ114'
    else return 'mz'
  }

  if (/^PB/i.test(normalized) || /^\d{3,4}$/.test(normalized)) {
    if (num >= 1 && num <= 7) return 'PB01_PB07'
    if (num >= 8 && num <= 17) return 'PB08_PB17'
    if (num >= 18 && num <= 23) return 'PB18_PB23'
    if ((num >= 24 && num <= 27) || (num >= 40 && num <= 43)) return 'PB24_PB43'
    if ((num >= 28 && num <= 31) || (num >= 44 && num <= 47)) return 'PB28_PB47'
    if ((num >= 32 && num <= 35) || (num >= 48 && num <= 51)) return 'PB32_PB51'
    if ((num >= 36 && num <= 39) || (num >= 52 && num <= 55)) return 'PB36_PB55'
    if ((num >= 56 && num <= 59) || (num >= 64 && num <= 67)) return 'PB56_PB67'
    if ((num >= 60 && num <= 63) || (num >= 68 && num <= 71)) return 'PB60_PB71'
  }

  if (/^IC3/i.test(normalized)) {
    if (num >= 3001 && num <= 3005) return 'isa'
    if (num >= 3006 && num <= 3013) return 'c06_13'
    if (num >= 3014 && num <= 3021) return 'c14_21'
    if (num >= 3022 && num <= 3029) return 'c22_29'
    if (num >= 3030 && num <= 3035) return 'c30_35'
    if (num >= 3036 && num <= 3039) return 'c36_39'
  }

  if (num >= 9001 && num <= 9005) return '9001_9005'
  if (num >= 9006 && num <= 9015) return '9006_9015'
  if (num >= 9016 && num <= 9022) return '9016_9022'
  if (num >= 9023 && num <= 9030) return '9023_9030'
  if (num >= 9031 && num <= 9034) return '9031_9034'
  if (num >= 9035 && num <= 9036) return '9035_9036'
  if (num >= 9037 && num <= 9040) return '9037_9040'
  if (num >= 9041 && num <= 9048) return '9041_9048'
  if (num >= 9049 && num <= 9052) return '9049_9052'
  if (num >= 9053 && num <= 9056) return '9053_9056'
  if (num >= 9057 && num <= 9060) return '9057_9060'
  if (num >= 9061 && num <= 9064) return '9061_9064'
  if (num >= 9065 && num <= 9072) return '9065_9072'
  if (num >= 9073 && num <= 9074) return '9073_9074'
  if (num >= 9075 && num <= 9078) return '9075_9078'
  if (num >= 9079 && num <= 9086) return '9079_9086'

  return 'unknown'
}
