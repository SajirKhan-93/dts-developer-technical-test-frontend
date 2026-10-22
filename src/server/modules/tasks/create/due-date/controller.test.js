import { describe, test, expect, beforeEach } from 'vitest'

import { dueDateController } from './controller.js'
import {
  buildH,
  buildRequest
} from '../../../../common/test-helpers/hapi-mocks.js'

const goodPayload = {
  'dueDate-day': '30',
  'dueDate-month': '11',
  'dueDate-year': '2099',
  dueTime: '17:00'
}

describe('dueDateController', () => {
  let h

  beforeEach(() => {
    h = buildH()
  })

  describe('getHandler', () => {
    test('shows an empty date and time with a back link to the status', async () => {
      await dueDateController.getHandler(buildRequest(), h)

      const [view, context] = h.view.mock.calls[0]
      expect(view).toBe('modules/tasks/create/due-date/index')
      expect(context.formData).toEqual({
        'dueDate-day': '',
        'dueDate-month': '',
        'dueDate-year': '',
        dueTime: ''
      })
      expect(context.backLink).toBe('/tasks/new/status')
    })

    test('pre-fills the saved date and time', async () => {
      const request = buildRequest({
        session: {
          newTask: {
            dueDate: { day: '1', month: '2', year: '2099' },
            dueTime: '09:30'
          }
        }
      })

      await dueDateController.getHandler(request, h)

      expect(h.view.mock.calls[0][1].formData).toEqual({
        'dueDate-day': '1',
        'dueDate-month': '2',
        'dueDate-year': '2099',
        dueTime: '09:30'
      })
    })

    test('links back to check answers when changing the answer', async () => {
      await dueDateController.getHandler(
        buildRequest({ query: { from: 'check-answers' } }),
        h
      )

      expect(h.view.mock.calls[0][1].backLink).toBe('/tasks/new/check-answers')
    })
  })

  describe('postHandler', () => {
    test('saves the date, time and combined date-time, then goes to check answers', async () => {
      const request = buildRequest({
        payload: { ...goodPayload, 'dueDate-day': ' 7 ', dueTime: ' 9:05 ' },
        session: { newTask: { title: 'T' } }
      })

      await dueDateController.postHandler(request, h)

      expect(request.yar.set).toHaveBeenCalledWith('newTask', {
        title: 'T',
        dueDate: { day: '7', month: '11', year: '2099' },
        dueTime: '9:05',
        dueDateTime: '2099-11-07T09:05:00'
      })
      expect(h.redirect).toHaveBeenCalledWith('/tasks/new/check-answers')
    })

    test('asks for a date when none is entered', async () => {
      await dueDateController.postHandler(
        buildRequest({ payload: { dueTime: '10:00' } }),
        h
      )

      expect(h.view.mock.calls[0][1].errorList).toEqual([
        { text: 'Enter a due date', href: '#dueDate-day' }
      ])
    })

    test('rejects a date that does not exist and keeps what was typed', async () => {
      await dueDateController.postHandler(
        buildRequest({
          payload: { ...goodPayload, 'dueDate-day': '31', 'dueDate-month': '2' }
        }),
        h
      )

      const context = h.view.mock.calls[0][1]
      expect(context.fieldErrors.dueDate.text).toBe(
        'Due date must be a real date, for example 27 3 2027'
      )
      expect(context.formData['dueDate-day']).toBe('31')
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('shows time errors against the time input', async () => {
      await dueDateController.postHandler(
        buildRequest({ payload: { ...goodPayload, dueTime: '25:00' } }),
        h
      )

      const context = h.view.mock.calls[0][1]
      expect(context.fieldErrors.dueTime.text).toBe(
        'Due time must be in 24-hour format, for example 17:30'
      )
      expect(context.fieldErrors.dueDate).toBeUndefined()
      expect(context.errorList[0].href).toBe('#dueTime')
    })

    test('asks for a time when none is entered', async () => {
      await dueDateController.postHandler(
        buildRequest({ payload: { ...goodPayload, dueTime: '' } }),
        h
      )

      expect(h.view.mock.calls[0][1].errorList[0].text).toBe('Enter a due time')
    })

    test('returns to check answers after changing the date', async () => {
      await dueDateController.postHandler(
        buildRequest({
          payload: goodPayload,
          query: { from: 'check-answers' }
        }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith('/tasks/new/check-answers')
    })

    test('asks for both the date and the time when neither is entered', async () => {
      await dueDateController.postHandler(buildRequest({ payload: {} }), h)

      const context = h.view.mock.calls[0][1]
      expect(context.errorList).toEqual([
        { text: 'Enter a due date', href: '#dueDate-day' },
        { text: 'Enter a due time', href: '#dueTime' }
      ])
      expect(context.fieldErrors.dueDate.text).toBe('Enter a due date')
      expect(context.fieldErrors.dueTime.text).toBe('Enter a due time')
    })

    test('treats a missing payload as nothing entered', async () => {
      await dueDateController.postHandler(buildRequest({ payload: null }), h)

      expect(h.view.mock.calls[0][1].errorList).toHaveLength(2)
    })
  })
})
