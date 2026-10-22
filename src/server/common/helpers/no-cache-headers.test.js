import { describe, test, expect, vi } from 'vitest'

import { noCacheHeaders } from './no-cache-headers.js'
import { buildH } from '../test-helpers/hapi-mocks.js'

describe('noCacheHeaders', () => {
  test('sets Cache-Control: no-store on normal responses', () => {
    const h = buildH()
    const response = { isBoom: false, header: vi.fn() }

    const result = noCacheHeaders({ path: '/tasks/1', response }, h)

    expect(response.header).toHaveBeenCalledWith('Cache-Control', 'no-store')
    expect(result).toBe(h.continue)
  })

  test('sets the header on error responses too', () => {
    const h = buildH()
    const response = { isBoom: true, output: { headers: {} } }

    noCacheHeaders({ path: '/tasks/1', response }, h)

    expect(response.output.headers['Cache-Control']).toBe('no-store')
  })

  test.each([
    '/public/govuk-frontend.min.css',
    '/assets/images/favicon.ico',
    '/favicon.ico',
    '/health'
  ])('leaves %s cacheable', (path) => {
    const h = buildH()
    const response = { isBoom: false, header: vi.fn() }

    const result = noCacheHeaders({ path, response }, h)

    expect(response.header).not.toHaveBeenCalled()
    expect(result).toBe(h.continue)
  })
})
