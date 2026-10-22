import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  checkTaskTitle,
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTaskStatus
} from './task-service.js'

const jsonResponse = (status, body) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status })

describe('task-service', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  test('getTasks returns the tasks', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, [{ id: 1 }]))

    const result = await getTasks()

    expect(result).toEqual({ success: true, status: 200, data: [{ id: 1 }] })
    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3001/api/v1/tasks'
    )
  })

  test('getTasks sends the search as an encoded query string', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []))

    await getTasks({ search: 'review & call' })

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3001/api/v1/tasks?search=review+%26+call'
    )
  })

  test('getTasks leaves out an empty search', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []))

    await getTasks({ search: '' })

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3001/api/v1/tasks'
    )
  })

  test('checkTaskTitle posts the title to the check endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { valid: true }))

    await checkTaskTitle('Review bundle')

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3001/api/v1/tasks/check-title')
    expect(options.method).toBe('POST')
    expect(options.body).toBe('{"title":"Review bundle"}')
  })

  test('getTask requests the task by id', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 5 }))

    await getTask('5')

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3001/api/v1/tasks/5'
    )
  })

  test('createTask posts the task as JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 1 }))

    await createTask({ title: 'T' })

    const [, options] = fetchMock.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(options.body).toBe('{"title":"T"}')
  })

  test('updateTaskStatus patches the status endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 1 }))

    await updateTaskStatus(1, 'COMPLETED')

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3001/api/v1/tasks/1/status')
    expect(options.method).toBe('PATCH')
    expect(options.body).toBe('{"status":"COMPLETED"}')
  })

  test('deleteTask handles an empty 204 response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(204))

    const result = await deleteTask(1)

    expect(result).toEqual({ success: true, status: 204, data: null })
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
  })

  test('returns backend validation errors', async () => {
    const validationErrors = [
      { field: 'title', errorCode: 'TASK_TITLE_REQUIRED' }
    ]
    fetchMock.mockResolvedValue(jsonResponse(400, { validationErrors }))

    const result = await createTask({})

    expect(result).toEqual({
      success: false,
      status: 400,
      errors: undefined,
      validationErrors
    })
  })

  test('returns backend errors such as not found', async () => {
    const errors = [{ errorCode: 'TASK_NOT_FOUND', message: 'x', field: 'id' }]
    fetchMock.mockResolvedValue(jsonResponse(404, { errors }))

    const result = await getTask(9)

    expect(result.success).toBe(false)
    expect(result.status).toBe(404)
    expect(result.errors).toEqual(errors)
  })

  test('reports the backend as unavailable when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await getTasks()

    expect(result.success).toBe(false)
    expect(result.status).toBe(503)
    expect(result.errors[0].errorCode).toBe('BACKEND_UNAVAILABLE')
  })

  test('encodes the id in the URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, {}))

    await getTask('../etc')

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3001/api/v1/tasks/..%2Fetc'
    )
  })
})
