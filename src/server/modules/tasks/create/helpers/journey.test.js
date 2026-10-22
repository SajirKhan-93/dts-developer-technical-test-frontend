import { describe, test, expect, vi } from 'vitest'
import {
  changeLink,
  getBackLink,
  getSessionData,
  isChangeMode,
  redirectToNextStep,
  requireAllAnswers,
  requireTitle,
  requireTitleAndStatus,
  resetSessionData,
  updateSessionData
} from './journey.js'

const buildRequest = (stored, query = {}) => {
  const store = { newTask: stored }
  return {
    query,
    yar: {
      get: vi.fn((key) => store[key]),
      set: vi.fn((key, value) => {
        store[key] = value
      }),
      clear: vi.fn((key) => {
        delete store[key]
      })
    }
  }
}

const buildH = () => ({
  redirect: vi.fn().mockReturnValue({ takeover: () => 'taken-over' }),
  continue: Symbol('continue')
})

describe('journey helpers', () => {
  test('session data defaults to an empty object', () => {
    expect(getSessionData(buildRequest(undefined))).toEqual({})
  })

  test('updateSessionData merges new answers into the existing ones', () => {
    const request = buildRequest({ title: 'T' })

    updateSessionData(request, { status: 'TODO' })

    expect(request.yar.set).toHaveBeenCalledWith('newTask', {
      title: 'T',
      status: 'TODO'
    })
  })

  test('resetSessionData clears the answers', () => {
    const request = buildRequest({ title: 'T' })

    resetSessionData(request)

    expect(getSessionData(request)).toEqual({})
  })

  test('change mode is only on for the check answers marker', () => {
    expect(isChangeMode({ query: { from: 'check-answers' } })).toBe(true)
    expect(isChangeMode({ query: { from: 'elsewhere' } })).toBe(false)
    expect(isChangeMode({ query: {} })).toBe(false)
  })

  test('changeLink adds the check answers marker', () => {
    expect(changeLink('/tasks/new/title')).toBe(
      '/tasks/new/title?from=check-answers'
    )
  })

  test('back link and next step return to check answers in change mode', () => {
    const changing = buildRequest({}, { from: 'check-answers' })
    const h = buildH()

    expect(getBackLink(changing, '/previous')).toBe('/tasks/new/check-answers')
    redirectToNextStep(changing, h, '/next')

    expect(h.redirect).toHaveBeenCalledWith('/tasks/new/check-answers')
  })

  test('back link and next step follow the journey otherwise', () => {
    const request = buildRequest({})
    const h = buildH()

    expect(getBackLink(request, '/previous')).toBe('/previous')
    redirectToNextStep(request, h, '/next')

    expect(h.redirect).toHaveBeenCalledWith('/next')
  })

  describe('guards', () => {
    test('requireTitle sends the user to the title page when there is none', () => {
      const h = buildH()

      const result = requireTitle.method(buildRequest({}), h)

      expect(h.redirect).toHaveBeenCalledWith('/tasks/new/title')
      expect(result).toBe('taken-over')
    })

    test('requireTitle lets the user continue once there is a title', () => {
      const h = buildH()

      expect(requireTitle.method(buildRequest({ title: 'T' }), h)).toBe(
        h.continue
      )
    })

    test('requireTitleAndStatus sends the user to the first missing answer', () => {
      const h = buildH()

      requireTitleAndStatus.method(buildRequest({ title: 'T' }), h)

      expect(h.redirect).toHaveBeenCalledWith('/tasks/new/status')
    })

    test('requireAllAnswers needs title, status and due date/time', () => {
      const h = buildH()

      requireAllAnswers.method(buildRequest({ title: 'T', status: 'TODO' }), h)

      expect(h.redirect).toHaveBeenCalledWith('/tasks/new/due-date')
      expect(
        requireAllAnswers.method(
          buildRequest({
            title: 'T',
            status: 'TODO',
            dueDateTime: '2099-01-01T10:00:00'
          }),
          buildH()
        )
      ).toBeDefined()
    })
  })
})
