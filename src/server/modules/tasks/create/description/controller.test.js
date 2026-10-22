import { describe, test, expect, beforeEach } from 'vitest'

import { descriptionController } from './controller.js'
import {
  buildH,
  buildRequest
} from '../../../../common/test-helpers/hapi-mocks.js'

describe('descriptionController', () => {
  let h

  beforeEach(() => {
    h = buildH()
  })

  describe('getHandler', () => {
    test('shows an empty description page with a back link to the title', async () => {
      await descriptionController.getHandler(buildRequest(), h)

      const [view, context] = h.view.mock.calls[0]
      expect(view).toBe('modules/tasks/create/description/index')
      expect(context.formData).toEqual({ description: '' })
      expect(context.backLink).toBe('/tasks/new/title')
    })

    test('pre-fills the saved description', async () => {
      const request = buildRequest({
        session: { newTask: { title: 'T', description: 'Saved' } }
      })

      await descriptionController.getHandler(request, h)

      expect(h.view.mock.calls[0][1].formData.description).toBe('Saved')
    })

    test('links back to check answers when changing the answer', async () => {
      await descriptionController.getHandler(
        buildRequest({ query: { from: 'check-answers' } }),
        h
      )

      expect(h.view.mock.calls[0][1].backLink).toBe('/tasks/new/check-answers')
    })
  })

  describe('postHandler', () => {
    test('saves a trimmed description and moves on to the status', async () => {
      const request = buildRequest({
        payload: { description: '  Check it  ' },
        session: { newTask: { title: 'T' } }
      })

      await descriptionController.postHandler(request, h)

      expect(request.yar.set).toHaveBeenCalledWith('newTask', {
        title: 'T',
        description: 'Check it'
      })
      expect(h.redirect).toHaveBeenCalledWith('/tasks/new/status')
    })

    test('the description is optional', async () => {
      const request = buildRequest({ payload: { description: '' } })

      await descriptionController.postHandler(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/tasks/new/status')
    })

    test('rejects a description that is too long and keeps what was typed', async () => {
      const description = 'a'.repeat(2001)

      await descriptionController.postHandler(
        buildRequest({ payload: { description } }),
        h
      )

      const context = h.view.mock.calls[0][1]
      expect(context.errorList).toEqual([
        {
          text: 'Description must be 2000 characters or fewer',
          href: '#description'
        }
      ])
      expect(context.formData.description).toBe(description)
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('returns to check answers after changing the description', async () => {
      await descriptionController.postHandler(
        buildRequest({
          payload: { description: 'New' },
          query: { from: 'check-answers' }
        }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith('/tasks/new/check-answers')
    })
  })
})
