import { describe, test, expect, beforeEach, vi } from 'vitest'

import { viewController } from './controller.js'
import { getTask } from '../../../common/services/task/task-service.js'
import {
  apiFail,
  apiOk,
  buildH,
  buildRequest
} from '../../../common/test-helpers/hapi-mocks.js'

vi.mock('../../../common/services/task/task-service.js')

const task = {
  id: 4,
  title: 'Review bundle',
  description: null,
  status: 'IN_PROGRESS',
  dueDateTime: '2000-01-01T09:00:00',
  createdAt: '2026-10-22T09:15:30.000Z'
}

describe('viewController', () => {
  let h

  beforeEach(() => {
    h = buildH()
    getTask.mockResolvedValue(apiOk(task))
  })

  describe('getHandler', () => {
    test('renders the task with a status form set to its status', async () => {
      await viewController.getHandler(buildRequest({ params: { id: '4' } }), h)

      expect(getTask).toHaveBeenCalledWith('4')
      const [view, context] = h.view.mock.calls[0]
      expect(view).toBe('modules/tasks/view/index')
      expect(context.task).toMatchObject({
        id: 4,
        title: 'Review bundle',
        description: '',
        overdue: true
      })
      expect(
        context.statusItems.filter((item) => item.selected).map((i) => i.value)
      ).toEqual(['IN_PROGRESS'])
      expect(context.errorList).toEqual([])
    })

    test('shows and clears a success notice', async () => {
      const request = buildRequest({ params: { id: '4' } })
      request.yar.flash('notice', 'status_updated')

      await viewController.getHandler(request, h)

      expect(h.view.mock.calls[0][1].notice).toBe('Task status updated')
    })

    test('renders the not found page when the task does not exist', async () => {
      getTask.mockResolvedValue(apiFail(404))

      await viewController.getHandler(buildRequest({ params: { id: '9' } }), h)

      expect(h.view).toHaveBeenCalledWith('error/index', {
        pageTitle: 'Page not found',
        message: 'Page not found'
      })
      expect(h.code).toHaveBeenCalledWith(404)
    })

    test('renders an error page when the backend is unavailable', async () => {
      getTask.mockResolvedValue(
        apiFail(503, { errors: [{ errorCode: 'BACKEND_UNAVAILABLE' }] })
      )

      await viewController.getHandler(buildRequest({ params: { id: '4' } }), h)

      expect(h.view.mock.calls[0][1].detail).toBe(
        'The task service is unavailable. Please try again later.'
      )
      expect(h.code).toHaveBeenCalledWith(503)
    })
  })

  describe('render', () => {
    test('shows errors against the status field', async () => {
      await viewController.render(buildRequest({ params: { id: '4' } }), h, {
        status: 'TASK_STATUS_INVALID'
      })

      const context = h.view.mock.calls[0][1]
      expect(context.fieldErrors.status).toEqual({
        text: 'Select a valid status'
      })
      expect(context.errorList).toEqual([
        { text: 'Select a valid status', href: '#status' }
      ])
    })
  })
})
