const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/

/**
 * Formats the backend's timezone-less date-time for display, as written,
 * e.g. '2026-11-30T17:00:00' -> '30 November 2026, 17:00'.
 * Unrecognised input is returned unchanged.
 */
export function formatDateTime(value) {
  const match = LOCAL_DATE_TIME.exec(value ?? '')
  if (!match) {
    return value ?? ''
  }

  const [, year, month, day, hours, minutes] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  const dateText = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })

  return `${dateText}, ${hours}:${minutes}`
}
