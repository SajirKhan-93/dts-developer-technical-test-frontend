import { describe, test, expect, beforeEach, vi } from 'vitest'

import { updateStatusController } from './controller.js'
import { updateTaskStatus } from '../../../common/services/task/task-service.js'
import { viewController } from '../view/controller.js'
import {
  apiFail,
  apiOk,
  buildH,
  buildRequest
} from '../../../common/test-helpers/hapi-mocks.js'

vi.mock('../../../common/services/task/task-service.js')
vi.mock('../view/controller.js', () => ({
  viewController: { render: vi.fn() }
}))

describe('updateStatusController', () => {
  let h

  beforeEach(() => {
    h = buildH()
    viewController.render.mockResolvedValue('rendered')
  })

  test('updates the status, sets a notice and returns to the task', async () => {
    updateTaskStatus.mockResolvedValue(apiOk({ id: 4 }))
    const request = buildRequest({
      params: { id: '4' },
      payload: { status: 'COMPLETED' }
    })

    await updateStatusController.postHandler(request, h)

    expect(updateTaskStatus).toHaveBeenCalledWith('4', 'COMPLETED')
    expect(request.yar.flash).toHaveBeenCalledWith('notice', 'status_updated')
    expect(h.redirect).toHaveBeenCalledWith('/tasks/4')
  })

  test('shows the task page with an error for an unknown status, without updating', async () => {
    const request = buildRequest({
      params: { id: '4' },
      payload: { status: 'DONE' }
    })

    const result = await updateStatusController.postHandler(request, h)

    expect(result).toBe('rendered')
    expect(viewController.render).toHaveBeenCalledWith(request, h, {
      status: 'TASK_STATUS_INVALID'
    })
    expect(updateTaskStatus).not.toHaveBeenCalled()
  })

  test('shows the task page with an error when no status is sent', async () => {
    const request = buildRequest({ params: { id: '4' }, payload: null })

    await updateStatusController.postHandler(request, h)

    expect(viewController.render).toHaveBeenCalledWith(request, h, {
      status: 'TASK_STATUS_REQUIRED'
    })
  })

  test('shows the backend validation error on the task page', async () => {
    updateTaskStatus.mockResolvedValue(
      apiFail(400, {
        validationErrors: [
          { field: 'status', errorCode: 'TASK_STATUS_INVALID' }
        ]
      })
    )
    const request = buildRequest({
      params: { id: '4' },
      payload: { status: 'TODO' }
    })

    await updateStatusController.postHandler(request, h)

    expect(viewController.render).toHaveBeenCalledWith(request, h, {
      status: 'TASK_STATUS_INVALID'
    })
  })

  test('renders the not found page when the task has gone', async () => {
    updateTaskStatus.mockResolvedValue(apiFail(404))

    await updateStatusController.postHandler(
      buildRequest({ params: { id: '4' }, payload: { status: 'TODO' } }),
      h
    )

    expect(h.code).toHaveBeenCalledWith(404)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  test('renders an error page when the backend is unavailable', async () => {
    updateTaskStatus.mockResolvedValue(
      apiFail(503, { errors: [{ errorCode: 'BACKEND_UNAVAILABLE' }] })
    )

    await updateStatusController.postHandler(
      buildRequest({ params: { id: '4' }, payload: { status: 'TODO' } }),
      h
    )

    expect(h.code).toHaveBeenCalledWith(503)
  })
})
