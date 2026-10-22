import { describe, test, expect, beforeEach, vi } from 'vitest'

import { checkAnswersController } from './controller.js'
import { createTask } from '../../../../common/services/task/task-service.js'
import {
  apiFail,
  apiOk,
  buildH,
  buildRequest
} from '../../../../common/test-helpers/hapi-mocks.js'

vi.mock('../../../../common/services/task/task-service.js')

const answers = {
  title: 'Review bundle',
  description: 'Check it',
  status: 'TODO',
  dueDateTime: '2099-11-30T17:00:00'
}

const requestWithAnswers = (overrides = {}) =>
  buildRequest({ session: { newTask: answers }, ...overrides })

describe('checkAnswersController', () => {
  let h

  beforeEach(() => {
    h = buildH()
  })

  describe('getHandler', () => {
    test('shows the answers with a Change link for each question', async () => {
      await checkAnswersController.getHandler(requestWithAnswers(), h)

      const [view, context] = h.view.mock.calls[0]
      expect(view).toBe('modules/tasks/create/check-answers/index')
      expect(context.answers).toEqual(answers)
      expect(context.changeLinks).toEqual({
        title: '/tasks/new/title?from=check-answers',
        description: '/tasks/new/description?from=check-answers',
        status: '/tasks/new/status?from=check-answers',
        dueDateTime: '/tasks/new/due-date?from=check-answers'
      })
      expect(context.backLink).toBe('/tasks/new/due-date')
      expect(context.errorList).toEqual([])
    })
  })

  describe('postHandler', () => {
    test('creates the task from the answers', async () => {
      createTask.mockResolvedValue(apiOk({ id: 9 }))

      await checkAnswersController.postHandler(requestWithAnswers(), h)

      expect(createTask).toHaveBeenCalledWith(answers)
    })

    test('leaves the description out when it is blank', async () => {
      createTask.mockResolvedValue(apiOk({ id: 9 }))
      const request = buildRequest({
        session: { newTask: { ...answers, description: '' } }
      })

      await checkAnswersController.postHandler(request, h)

      expect(createTask.mock.calls[0][0].description).toBeUndefined()
    })

    test('forgets the answers, sets a notice and redirects to the new task', async () => {
      createTask.mockResolvedValue(apiOk({ id: 9 }))
      const request = requestWithAnswers()

      await checkAnswersController.postHandler(request, h)

      expect(request.yar.clear).toHaveBeenCalledWith('newTask')
      expect(request.yar.flash).toHaveBeenCalledWith('notice', 'created')
      expect(h.redirect).toHaveBeenCalledWith('/tasks/9')
    })

    test('links to the title page when the title was taken in the meantime', async () => {
      createTask.mockResolvedValue(
        apiFail(409, {
          errors: [{ errorCode: 'TASK_TITLE_DUPLICATE', field: 'title' }]
        })
      )
      const request = requestWithAnswers()

      await checkAnswersController.postHandler(request, h)

      expect(h.view.mock.calls[0][1].errorList).toEqual([
        {
          text: 'A task with this title already exists. Enter a different title',
          href: '/tasks/new/title?from=check-answers'
        }
      ])
      expect(request.yar.clear).not.toHaveBeenCalled()
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('links each backend validation error to the page that fixes it', async () => {
      createTask.mockResolvedValue(
        apiFail(400, {
          validationErrors: [
            { field: 'dueDateTime', errorCode: 'TASK_DUE_DATE_TIME_INVALID' },
            { field: 'status', errorCode: 'TASK_STATUS_INVALID' },
            { field: 'description', errorCode: 'TASK_DESCRIPTION_TOO_LONG' }
          ]
        })
      )

      await checkAnswersController.postHandler(requestWithAnswers(), h)

      expect(h.view.mock.calls[0][1].errorList).toEqual([
        {
          text: 'Enter a real due date and time',
          href: '/tasks/new/due-date?from=check-answers'
        },
        {
          text: 'Select a valid status',
          href: '/tasks/new/status?from=check-answers'
        },
        {
          text: 'Description must be 2000 characters or fewer',
          href: '/tasks/new/description?from=check-answers'
        }
      ])
    })

    test('shows an error without a link when the backend cannot be reached', async () => {
      createTask.mockResolvedValue(
        apiFail(503, {
          errors: [{ errorCode: 'BACKEND_UNAVAILABLE', field: null }]
        })
      )

      await checkAnswersController.postHandler(requestWithAnswers(), h)

      expect(h.view.mock.calls[0][1].errorList).toEqual([
        { text: 'The task service is unavailable. Please try again later.' }
      ])
    })

    test('shows a generic error when the backend gave no details', async () => {
      createTask.mockResolvedValue(apiFail(500))

      await checkAnswersController.postHandler(requestWithAnswers(), h)

      expect(h.view.mock.calls[0][1].errorList).toEqual([
        { text: 'Something went wrong. Please try again.' }
      ])
    })
  })
})
