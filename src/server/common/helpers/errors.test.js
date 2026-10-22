import { describe, test, expect, vi } from 'vitest'

import { catchAll } from './errors.js'
import { buildH } from '../test-helpers/hapi-mocks.js'

const boom = (statusCode) => ({
  response: { isBoom: true, output: { statusCode }, stack: 'stack trace' },
  logger: { error: vi.fn() }
})

describe('catchAll', () => {
  test('lets normal responses through', () => {
    const h = buildH()

    const result = catchAll({ response: { variety: 'view' } }, h)

    expect(result).toBe(h.continue)
    expect(h.view).not.toHaveBeenCalled()
  })

  test.each([
    [404, 'Page not found'],
    [403, 'Forbidden'],
    [400, 'Bad Request'],
    [418, 'Something went wrong']
  ])('renders the error page for a %i with "%s"', (status, message) => {
    const h = buildH()

    catchAll(boom(status), h)

    expect(h.view).toHaveBeenCalledWith('error/index', {
      pageTitle: message,
      heading: status,
      message
    })
    expect(h.code).toHaveBeenCalledWith(status)
  })

  test('logs the stack of server errors only', () => {
    const serverError = boom(500)
    const clientError = boom(404)

    catchAll(serverError, buildH())
    catchAll(clientError, buildH())

    expect(serverError.logger.error).toHaveBeenCalledWith('stack trace')
    expect(clientError.logger.error).not.toHaveBeenCalled()
  })
})
