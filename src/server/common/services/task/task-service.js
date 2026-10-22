import { config } from '../../../../config/config.js'
import { createLogger } from '../../helpers/logging/logger.js'
import { statusCodes } from '../../constants/status-codes.js'

const logger = createLogger()

const API_PREFIX = '/api/v1/tasks'

/**
 * Calls the backend and always resolves to a result object, so controllers
 * never have to deal with thrown network errors:
 *   { success: true, status, data }
 *   { success: false, status, errors?, validationErrors? }
 */
async function callApi(path, { method = 'GET', body } = {}) {
  const url = `${config.get('backendApi.baseUrl')}${path}`

  try {
    const response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(config.get('backendApi.timeoutMs'))
    })

    const text = await response.text()
    const data = text ? JSON.parse(text) : null

    if (response.ok) {
      return { success: true, status: response.status, data }
    }

    return {
      success: false,
      status: response.status,
      errors: data?.errors,
      validationErrors: data?.validationErrors
    }
  } catch (error) {
    logger.error(error, `Task API request failed: ${method} ${path}`)
    return {
      success: false,
      status: statusCodes.serviceUnavailable,
      errors: [{ errorCode: 'BACKEND_UNAVAILABLE', field: null }]
    }
  }
}

const taskUrl = (id) => `${API_PREFIX}/${encodeURIComponent(String(id))}`

export const getTasks = ({ search } = {}) =>
  callApi(
    search ? `${API_PREFIX}?${new URLSearchParams({ search })}` : API_PREFIX
  )

export const checkTaskTitle = (title) =>
  callApi(`${API_PREFIX}/check-title`, { method: 'POST', body: { title } })

export const getTask = (id) => callApi(taskUrl(id))

export const createTask = (task) =>
  callApi(API_PREFIX, { method: 'POST', body: task })

export const updateTaskStatus = (id, status) =>
  callApi(`${taskUrl(id)}/status`, { method: 'PATCH', body: { status } })

export const deleteTask = (id) => callApi(taskUrl(id), { method: 'DELETE' })
