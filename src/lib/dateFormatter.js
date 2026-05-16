const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function formatDateForDisplay(isoString) {
  if (!isoString) return ''
  const [year, month, day] = isoString.split('-').map(Number)
  return `${day} de ${MONTHS[month - 1]} de ${year}`
}

export function formatDateForPdf(isoString) {
  return formatDateForDisplay(isoString)
}

export function formatDateShort(isoString) {
  if (!isoString) return ''
  const [year, month, day] = isoString.split('-').map(Number)
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}
