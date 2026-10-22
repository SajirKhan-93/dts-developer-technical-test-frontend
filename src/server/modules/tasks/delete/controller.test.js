import { describe, test, expect, beforeEach, vi } from 'vitest'

import { deleteController } from './controller.js'
import {
  deleteTask,
  getTask
} from '../../../common/services/task/task-service.js'
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
  status: 'TODO',
  dueDateTime: '2099-11-30T17:00:00',
  createdAt: '2026-10-22T09:15:30.000Z'
}

describe('deleteController', () => {
  let h

  beforeEach(() => {
    h = buildH()
  })

  describe('getHandler', () => {
    test('asks for confirmation showing the task', async () => {
      getTask.mockResolvedValue(apiOk(task))

      await deleteController.getHandler(
        buildRequest({ params: { id: '4' } }),
        h
      )

      expect(getTask).toHaveBeenCalledWith('4')
      const [view, context] = h.view.mock.calls[0]
      expect(view).toBe('modules/tasks/delete/index')
      expect(context.task).toMatchObject({ id: 4, title: 'Review bundle' })
    })

    test('renders the not found page when the task does not exist', async () => {
      getTask.mockResolvedValue(apiFail(404))

      await deleteController.getHandler(
        buildRequest({ params: { id: '9' } }),
        h
      )

      expect(h.code).toHaveBeenCalledWith(404)
    })
  })

  describe('postHandler', () => {
    test('deletes the task, sets a notice and goes back to the list', async () => {
      deleteTask.mockResolvedValue(apiOk(null))
      const request = buildRequest({ params: { id: '4' } })

      await deleteController.postHandler(request, h)

      expect(deleteTask).toHaveBeenCalledWith('4')
      expect(request.yar.flash).toHaveBeenCalledWith('notice', 'deleted')
      expect(h.redirect).toHaveBeenCalledWith('/')
    })

    test('renders the not found page when the task has already gone', async () => {
      deleteTask.mockResolvedValue(apiFail(404))

      await deleteController.postHandler(
        buildRequest({ params: { id: '4' } }),
        h
      )

      expect(h.code).toHaveBeenCalledWith(404)
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('renders an error page when the backend is unavailable', async () => {
      deleteTask.mockResolvedValue(
        apiFail(503, { errors: [{ errorCode: 'BACKEND_UNAVAILABLE' }] })
      )

      await deleteController.postHandler(
        buildRequest({ params: { id: '4' } }),
        h
      )

      expect(h.code).toHaveBeenCalledWith(503)
    })
  })
})
