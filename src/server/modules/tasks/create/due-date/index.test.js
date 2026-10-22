import { describe, test, expect, vi } from 'vitest'

import { taskCreateDueDate } from './index.js'
import { dueDateController } from './controller.js'
import { requireTitleAndStatus } from '../helpers/journey.js'

describe('taskCreateDueDate plugin', () => {
  test('registers GET and POST /tasks/new/due-date, once title and status exist', () => {
    const server = { route: vi.fn() }

    taskCreateDueDate.plugin.register(server)

    const [routes] = server.route.mock.calls[0]
    expect(taskCreateDueDate.plugin.name).toBe('Tasks - Create - Due date')
    expect(routes.map((r) => `${r.method} ${r.path}`)).toEqual([
      'GET /tasks/new/due-date',
      'POST /tasks/new/due-date'
    ])
    expect(routes[0].options.handler).toBe(dueDateController.getHandler)
    expect(routes[1].options.handler).toBe(dueDateController.postHandler)
    expect(
      routes.every((r) => r.options.pre[0] === requireTitleAndStatus)
    ).toBe(true)
  })
})
