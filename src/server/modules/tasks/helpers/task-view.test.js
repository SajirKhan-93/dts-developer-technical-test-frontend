import { describe, test, expect, vi } from 'vitest'
import {
  buildFieldErrors,
  buildStatusItems,
  consumeNotice,
  getApiErrorCode,
  idParamFailAction,
  mapApiValidationErrors,
  renderBackendError,
  setNotice,
  toViewModel
} from './task-view.js'

const buildH = () => {
  const h = {
    view: vi.fn().mockReturnThis(),
    code: vi.fn().mockReturnThis(),
    takeover: vi.fn().mockReturnValue('taken-over')
  }
  return h
}

describe('task-view helpers', () => {
  test('toViewModel defaults a missing description and flags overdue tasks', () => {
    const vm = toViewModel({
      id: 3,
      title: 'T',
      description: null,
      status: 'TODO',
      dueDateTime: '2020-01-01T09:00:00'
    })

    expect(vm).toMatchObject({ id: 3, description: '', overdue: true })
  })

  test('toViewModel never flags completed tasks as overdue', () => {
    expect(
      toViewModel({
        id: 3,
        title: 'T',
        description: 'd',
        status: 'COMPLETED',
        dueDateTime: '2020-01-01T09:00:00'
      }).overdue
    ).toBe(false)
  })

  test('buildStatusItems marks the selected status', () => {
    const items = buildStatusItems('IN_PROGRESS')

    expect(items.map((i) => i.value)).toEqual([
      'TODO',
      'IN_PROGRESS',
      'COMPLETED'
    ])
    expect(items.filter((i) => i.selected).map((i) => i.value)).toEqual([
      'IN_PROGRESS'
    ])
    expect(items[1].text).toBe('In progress')
  })

  test('buildFieldErrors builds inline errors and a summary list', () => {
    const { fieldErrors, errorList } = buildFieldErrors(
      { title: 'TASK_TITLE_REQUIRED', dueDate: 'TASK_DUE_DATE_REQUIRED' },
      { dueDate: 'dueDate-day' }
    )

    expect(fieldErrors.title).toEqual({ text: 'Enter a title' })
    expect(errorList).toEqual([
      { text: 'Enter a title', href: '#title' },
      { text: 'Enter a due date', href: '#dueDate-day' }
    ])
  })

  test('mapApiValidationErrors renames backend fields and keeps the first error', () => {
    expect(
      mapApiValidationErrors(
        [
          { field: 'dueDateTime', errorCode: 'TASK_DUE_DATE_TIME_INVALID' },
          { field: 'dueDateTime', errorCode: 'OTHER' },
          { field: 'title', errorCode: 'TASK_TITLE_REQUIRED' }
        ],
        { dueDateTime: 'dueDate' }
      )
    ).toEqual({
      dueDate: 'TASK_DUE_DATE_TIME_INVALID',
      title: 'TASK_TITLE_REQUIRED'
    })
  })

  test('getApiErrorCode falls back to UNEXPECTED', () => {
    expect(getApiErrorCode({ errors: [{ errorCode: 'X' }] })).toBe('X')
    expect(getApiErrorCode({})).toBe('UNEXPECTED')
  })

  test('renderBackendError renders 404 for a missing task', () => {
    const h = buildH()

    renderBackendError(h, { status: 404 })

    expect(h.code).toHaveBeenCalledWith(404)
  })

  test('renderBackendError keeps 5xx statuses and shows a friendly message', () => {
    const h = buildH()

    renderBackendError(h, {
      status: 503,
      errors: [{ errorCode: 'BACKEND_UNAVAILABLE' }]
    })

    expect(h.code).toHaveBeenCalledWith(503)
    expect(h.view.mock.calls[0][1].detail).toBe(
      'The task service is unavailable. Please try again later.'
    )
  })

  test('renderBackendError turns other statuses into a 500', () => {
    const h = buildH()

    renderBackendError(h, { status: 400 })

    expect(h.code).toHaveBeenCalledWith(500)
  })

  test('idParamFailAction renders a 404 and takes over the response', () => {
    const h = buildH()

    expect(idParamFailAction({}, h)).toBe('taken-over')
    expect(h.code).toHaveBeenCalledWith(404)
  })

  test('notices are flashed once and translated', () => {
    const flash = vi.fn().mockReturnValueOnce(undefined)
    const request = { yar: { flash } }

    setNotice(request, 'created')
    expect(flash).toHaveBeenCalledWith('notice', 'created')

    flash.mockReturnValueOnce(['created'])
    expect(consumeNotice(request)).toBe('Task created')

    flash.mockReturnValueOnce([])
    expect(consumeNotice(request)).toBeUndefined()
  })
})
