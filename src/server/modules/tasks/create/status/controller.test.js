import { describe, test, expect, beforeEach } from 'vitest'

import { statusController } from './controller.js'
import {
  buildH,
  buildRequest
} from '../../../../common/test-helpers/hapi-mocks.js'

describe('statusController', () => {
  let h

  beforeEach(() => {
    h = buildH()
  })

  describe('getHandler', () => {
    test('shows the three statuses with nothing chosen yet', async () => {
      await statusController.getHandler(buildRequest(), h)

      const [view, context] = h.view.mock.calls[0]
      expect(view).toBe('modules/tasks/create/status/index')
      expect(context.statusItems.map((item) => item.value)).toEqual([
        'TODO',
        'IN_PROGRESS',
        'COMPLETED'
      ])
      expect(context.statusItems.some((item) => item.checked)).toBe(false)
      expect(context.backLink).toBe('/tasks/new/description')
    })

    test('pre-selects the saved status', async () => {
      const request = buildRequest({
        session: { newTask: { title: 'T', status: 'IN_PROGRESS' } }
      })

      await statusController.getHandler(request, h)

      const checked = h.view.mock.calls[0][1].statusItems.filter(
        (item) => item.checked
      )
      expect(checked.map((item) => item.value)).toEqual(['IN_PROGRESS'])
    })

    test('links back to check answers when changing the answer', async () => {
      await statusController.getHandler(
        buildRequest({ query: { from: 'check-answers' } }),
        h
      )

      expect(h.view.mock.calls[0][1].backLink).toBe('/tasks/new/check-answers')
    })
  })

  describe('postHandler', () => {
    test('saves the status and moves on to the due date', async () => {
      const request = buildRequest({
        payload: { status: 'COMPLETED' },
        session: { newTask: { title: 'T' } }
      })

      await statusController.postHandler(request, h)

      expect(request.yar.set).toHaveBeenCalledWith('newTask', {
        title: 'T',
        status: 'COMPLETED'
      })
      expect(h.redirect).toHaveBeenCalledWith('/tasks/new/due-date')
    })

    test('asks for a status when none is chosen', async () => {
      await statusController.postHandler(buildRequest({ payload: {} }), h)

      expect(h.view.mock.calls[0][1].errorList).toEqual([
        { text: 'Select a status', href: '#status' }
      ])
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('rejects a status that does not exist', async () => {
      await statusController.postHandler(
        buildRequest({ payload: { status: 'DONE' } }),
        h
      )

      expect(h.view.mock.calls[0][1].errorList[0].text).toBe(
        'Select a valid status'
      )
    })

    test('returns to check answers after changing the status', async () => {
      await statusController.postHandler(
        buildRequest({
          payload: { status: 'TODO' },
          query: { from: 'check-answers' }
        }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith('/tasks/new/check-answers')
    })

    test('treats a missing payload as nothing chosen', async () => {
      await statusController.postHandler(buildRequest({ payload: null }), h)

      expect(h.view.mock.calls[0][1].errorList[0].text).toBe('Select a status')
    })
  })
})
