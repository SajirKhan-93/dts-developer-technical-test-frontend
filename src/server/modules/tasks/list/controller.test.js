import { describe, test, expect, beforeEach, vi } from 'vitest'

import { listController } from './controller.js'
import { getTasks } from '../../../common/services/task/task-service.js'
import {
  apiFail,
  apiOk,
  buildH,
  buildRequest
} from '../../../common/test-helpers/hapi-mocks.js'

vi.mock('../../../common/services/task/task-service.js')

const task = {
  id: 1,
  title: 'Review bundle',
  description: null,
  status: 'TODO',
  dueDateTime: '2099-11-30T17:00:00',
  createdAt: '2026-10-22T09:15:30.000Z'
}

describe('listController', () => {
  let h

  beforeEach(() => {
    h = buildH()
    getTasks.mockResolvedValue(apiOk([task]))
  })

  test('renders the list with the tasks', async () => {
    await listController.getHandler(buildRequest(), h)

    expect(getTasks).toHaveBeenCalledWith({ search: '' })
    const [view, context] = h.view.mock.calls[0]
    expect(view).toBe('modules/tasks/list/index')
    expect(context.tasks).toHaveLength(1)
    expect(context.tasks[0]).toMatchObject({
      id: 1,
      title: 'Review bundle',
      description: '',
      overdue: false
    })
    expect(context.baseUrl).toBe('/')
    expect(context.filters).toEqual({ search: '' })
    expect(context.errorList).toEqual([])
    expect(h.code).not.toHaveBeenCalled()
  })

  test('searches by the title in the query', async () => {
    await listController.getHandler(
      buildRequest({ query: { search: '  bundle ' } }),
      h
    )

    expect(getTasks).toHaveBeenCalledWith({ search: 'bundle' })
    expect(h.view.mock.calls[0][1].filters).toEqual({ search: 'bundle' })
  })

  test('shows and clears a success notice', async () => {
    const request = buildRequest()
    request.yar.flash('notice', 'created')

    await listController.getHandler(request, h)

    expect(h.view.mock.calls[0][1].notice).toBe('Task created')
  })

  test('lists everything and reports an error when the search is too long', async () => {
    await listController.getHandler(
      buildRequest({ query: { search: 'a'.repeat(300) } }),
      h
    )

    expect(getTasks).toHaveBeenCalledWith({ search: undefined })
    const context = h.view.mock.calls[0][1]
    expect(context.searchError).toEqual({
      text: 'Search must be 255 characters or fewer'
    })
    expect(context.errorList).toEqual([
      { text: 'Search must be 255 characters or fewer', href: '#search' }
    ])
  })

  test('shows no tasks and the backend error when the backend is unavailable', async () => {
    getTasks.mockResolvedValue(
      apiFail(503, { errors: [{ errorCode: 'BACKEND_UNAVAILABLE' }] })
    )

    await listController.getHandler(buildRequest(), h)

    const context = h.view.mock.calls[0][1]
    expect(context.tasks).toEqual([])
    expect(context.errorList).toEqual([
      { text: 'The task service is unavailable. Please try again later.' }
    ])
    expect(h.code).toHaveBeenCalledWith(503)
  })

  test('uses a 500 for other backend failures', async () => {
    getTasks.mockResolvedValue(apiFail(400))

    await listController.getHandler(buildRequest(), h)

    expect(h.code).toHaveBeenCalledWith(500)
    expect(h.view.mock.calls[0][1].errorList[0].text).toBe(
      'Something went wrong. Please try again.'
    )
  })
})
