import { describe, test, expect, vi } from 'vitest'

import { health } from './index.js'
import { buildH } from '../../common/test-helpers/hapi-mocks.js'

describe('health plugin', () => {
  test('registers GET /health without CSRF checks', () => {
    const server = { route: vi.fn() }

    health.plugin.register(server)

    const [route] = server.route.mock.calls[0]
    expect(health.plugin.name).toBe('health')
    expect(route.method).toBe('GET')
    expect(route.path).toBe('/health')
    expect(route.options.plugins.crumb).toBe(false)
  })

  test('answers success', () => {
    const server = { route: vi.fn() }
    const h = buildH()
    health.plugin.register(server)

    server.route.mock.calls[0][0].handler({}, h)

    expect(h.response).toHaveBeenCalledWith({ message: 'success' })
    expect(h.code).toHaveBeenCalledWith(200)
  })
})
