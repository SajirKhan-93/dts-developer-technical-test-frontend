const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/
const DAY_MONTH_PATTERN = /^\d{1,2}$/
const YEAR_PATTERN = /^\d{4}$/

const pad = (n) => String(n).padStart(2, '0')

/**
 * Builds the backend's timezone-less date-time (yyyy-MM-ddTHH:mm:ss) from the
 * GOV.UK date input parts and a 24-hour time.
 *
 * @param {{ day?: string, month?: string, year?: string, time?: string }} input
 * @returns {{ value?: string, errors?: { dueDate?: string, dueTime?: string } }}
 *   value, or the error code to show against the date and/or the time
 */
export function parseDueDateTime({
  day = '',
  month = '',
  year = '',
  time = ''
}) {
  const d = day.trim()
  const m = month.trim()
  const y = year.trim()
  const t = time.trim()

  const errors = {}
  const dateError = validateDate(d, m, y)
  if (dateError) {
    errors.dueDate = dateError
  }

  const match = TIME_PATTERN.exec(t)
  if (!t) {
    errors.dueTime = 'TASK_DUE_TIME_REQUIRED'
  } else if (!match) {
    errors.dueTime = 'TASK_DUE_TIME_INVALID'
  }

  if (errors.dueDate || errors.dueTime) {
    return { errors }
  }

  return {
    value: `${y}-${pad(Number(m))}-${pad(Number(d))}T${pad(Number(match[1]))}:${match[2]}:00`
  }
}

function validateDate(d, m, y) {
  if (!d && !m && !y) {
    return 'TASK_DUE_DATE_REQUIRED'
  }

  if (
    !DAY_MONTH_PATTERN.test(d) ||
    !DAY_MONTH_PATTERN.test(m) ||
    !YEAR_PATTERN.test(y)
  ) {
    return 'TASK_DUE_DATE_INVALID'
  }

  const check = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  if (
    check.getUTCFullYear() !== Number(y) ||
    check.getUTCMonth() !== Number(m) - 1 ||
    check.getUTCDate() !== Number(d)
  ) {
    return 'TASK_DUE_DATE_INVALID'
  }

  return null
}

/**
 * True when the task is not completed and its due date/time has passed.
 * Both values are wall-clock times, so the backend value is compared as written.
 */
export function isOverdue(dueDateTime, completed, now = new Date()) {
  if (completed) {
    return false
  }
  const due = new Date(`${dueDateTime}Z`)
  const current = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return !Number.isNaN(due.getTime()) && due.getTime() < current.getTime()
}
