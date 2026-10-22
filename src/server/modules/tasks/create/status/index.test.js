import { describe, test, expect, vi } from 'vitest'

import { taskCreateStatus } from './index.js'
import { statusController } from './controller.js'
import { requireTitle } from '../helpers/journey.js'

describe('taskCreateStatus plugin', () => {
  test('registers GET and POST /tasks/new/status, once a title exists', () => {
    const server = { route: vi.fn() }

    taskCreateStatus.plugin.register(server)

    const [routes] = server.route.mock.calls[0]
    expect(taskCreateStatus.plugin.name).toBe('Tasks - Create - Status')
    expect(routes.map((r) => `${r.method} ${r.path}`)).toEqual([
      'GET /tasks/new/status',
      'POST /tasks/new/status'
    ])
    expect(routes[0].options.handler).toBe(statusController.getHandler)
    expect(routes[1].options.handler).toBe(statusController.postHandler)
    expect(routes.every((r) => r.options.pre[0] === requireTitle)).toBe(true)
  })
})
