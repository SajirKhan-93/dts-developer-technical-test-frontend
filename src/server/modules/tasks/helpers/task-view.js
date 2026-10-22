import { NOTICE_KEY, TASK_STATUSES } from '../../../common/constants/tasks.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { isOverdue } from '../../../common/helpers/due-date.js'
import { translate } from '../../../common/locales/translate.js'

/**
 * Shapes a backend task for the templates.
 */
export function toViewModel(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    dueDateTime: task.dueDateTime,
    overdue: isOverdue(task.dueDateTime, task.status === 'COMPLETED')
  }
}

/**
 * Items for the GOV.UK select (selected) and radios (checked) components.
 */
export function buildStatusItems(selected) {
  return TASK_STATUSES.map((value) => ({
    value,
    text: translate(`tasks.status.${value}`),
    selected: value === selected,
    checked: value === selected
  }))
}

/**
 * Turns { field: errorCode } into what the GOV.UK templates need: a
 * field -> { text } map for inline errors and an error summary list.
 * hrefs maps a field to the id of the first input to focus.
 */
export function buildFieldErrors(errors, hrefs = {}) {
  const fieldErrors = {}
  const errorList = []

  for (const [field, code] of Object.entries(errors)) {
    const text = translate(`tasks.errors.${code}`)
    fieldErrors[field] = { text }
    errorList.push({ text, href: `#${hrefs[field] ?? field}` })
  }

  return { fieldErrors, errorList }
}

/**
 * Maps validation errors from the backend ({ field, errorCode }[]) to
 * { formField: errorCode }, renaming backend fields to form fields.
 */
export function mapApiValidationErrors(validationErrors = [], fieldMap = {}) {
  const errors = {}

  for (const { field, errorCode } of validationErrors) {
    errors[fieldMap[field] ?? field] ??= errorCode
  }

  return errors
}

export function getApiErrorCode(result) {
  return result.errors?.[0]?.errorCode ?? 'UNEXPECTED'
}

export function renderNotFound(h) {
  return h
    .view('error/index', {
      pageTitle: translate('common.page_not_found'),
      message: translate('common.page_not_found')
    })
    .code(statusCodes.notFound)
}

/**
 * Renders the error page for a failed backend call: 404 for a missing task,
 * otherwise a 5xx with a friendly message.
 */
export function renderBackendError(h, result) {
  if (result.status === statusCodes.notFound) {
    return renderNotFound(h)
  }

  const code =
    result.status >= statusCodes.internalServerError
      ? result.status
      : statusCodes.internalServerError

  return h
    .view('error/index', {
      pageTitle: translate('common.something_went_wrong'),
      message: translate('common.something_went_wrong'),
      detail: translate(`tasks.errors.${getApiErrorCode(result)}`)
    })
    .code(code)
}

/** Hapi failAction for an invalid task ID in the URL */
export function idParamFailAction(_request, h) {
  return renderNotFound(h).takeover()
}

/** One-time success message, shown on the next page and then cleared */
export function setNotice(request, key) {
  request.yar.flash(NOTICE_KEY, key)
}

export function consumeNotice(request) {
  const [key] = request.yar.flash(NOTICE_KEY)
  return key ? translate(`tasks.notices.${key}`) : undefined
}
