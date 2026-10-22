import { describe, test, expect, beforeEach, vi } from 'vitest'

import { titleController } from './controller.js'
import { checkTaskTitle } from '../../../../common/services/task/task-service.js'
import {
  apiFail,
  apiOk,
  buildH,
  buildRequest
} from '../../../../common/test-helpers/hapi-mocks.js'

vi.mock('../../../../common/services/task/task-service.js')

describe('titleController', () => {
  let h

  beforeEach(() => {
    h = buildH()
    checkTaskTitle.mockResolvedValue(apiOk({ valid: true }))
  })

  describe('getHandler', () => {
    test('shows an empty title page with a back link to the list', async () => {
      await titleController.getHandler(buildRequest(), h)

      const [view, context] = h.view.mock.calls[0]
      expect(view).toBe('modules/tasks/create/title/index')
      expect(context.formData).toEqual({ title: '' })
      expect(context.backLink).toBe('/')
      expect(context.errorList).toEqual([])
    })

    test('pre-fills the title already entered', async () => {
      const request = buildRequest({ session: { newTask: { title: 'Saved' } } })

      await titleController.getHandler(request, h)

      expect(h.view.mock.calls[0][1].formData.title).toBe('Saved')
    })

    test('links back to check answers when changing the answer', async () => {
      const request = buildRequest({ query: { from: 'check-answers' } })

      await titleController.getHandler(request, h)

      expect(h.view.mock.calls[0][1].backLink).toBe('/tasks/new/check-answers')
    })
  })

  describe('postHandler', () => {
    test('asks for a title when it is blank, without calling the backend', async () => {
      await titleController.postHandler(
        buildRequest({ payload: { title: '   ' } }),
        h
      )

      const context = h.view.mock.calls[0][1]
      expect(context.errorList).toEqual([
        { text: 'Enter a title', href: '#title' }
      ])
      expect(context.fieldErrors.title).toEqual({ text: 'Enter a title' })
      expect(checkTaskTitle).not.toHaveBeenCalled()
    })

    test('keeps what was typed when there is an error', async () => {
      await titleController.postHandler(
        buildRequest({ payload: { title: 'a'.repeat(300) } }),
        h
      )

      expect(h.view.mock.calls[0][1].formData.title).toBe('a'.repeat(300))
      expect(h.view.mock.calls[0][1].errorList[0].text).toBe(
        'Title must be 255 characters or fewer'
      )
    })

    test('shows the backend error when the title is already used', async () => {
      checkTaskTitle.mockResolvedValue(
        apiFail(400, {
          validationErrors: [
            { field: 'title', errorCode: 'TASK_TITLE_DUPLICATE' }
          ]
        })
      )

      await titleController.postHandler(
        buildRequest({ payload: { title: 'Taken' } }),
        h
      )

      expect(h.view.mock.calls[0][1].errorList[0].text).toBe(
        'A task with this title already exists. Enter a different title'
      )
      expect(h.view.mock.calls[0][1].formData.title).toBe('Taken')
    })

    test('shows the service-unavailable message when the backend cannot be reached', async () => {
      checkTaskTitle.mockResolvedValue(
        apiFail(503, { errors: [{ errorCode: 'BACKEND_UNAVAILABLE' }] })
      )

      await titleController.postHandler(
        buildRequest({ payload: { title: 'T' } }),
        h
      )

      expect(h.view.mock.calls[0][1].errorList[0].text).toBe(
        'The task service is unavailable. Please try again later.'
      )
    })

    test('saves the cleaned title and moves on to the description', async () => {
      const request = buildRequest({ payload: { title: '  Review   bundle ' } })

      await titleController.postHandler(request, h)

      expect(checkTaskTitle).toHaveBeenCalledWith('Review bundle')
      expect(request.yar.set).toHaveBeenCalledWith('newTask', {
        title: 'Review bundle'
      })
      expect(h.redirect).toHaveBeenCalledWith('/tasks/new/description')
    })

    test('keeps the other answers when the title is saved', async () => {
      const request = buildRequest({
        payload: { title: 'New' },
        session: { newTask: { title: 'Old', status: 'TODO' } }
      })

      await titleController.postHandler(request, h)

      expect(request.yar.set).toHaveBeenCalledWith('newTask', {
        title: 'New',
        status: 'TODO'
      })
    })

    test('returns to check answers after changing the title', async () => {
      const request = buildRequest({
        payload: { title: 'Changed' },
        query: { from: 'check-answers' }
      })

      await titleController.postHandler(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/tasks/new/check-answers')
    })

    test('treats a missing payload as an empty title', async () => {
      await titleController.postHandler(buildRequest({ payload: null }), h)

      expect(h.view.mock.calls[0][1].errorList[0].text).toBe('Enter a title')
    })
  })
})
