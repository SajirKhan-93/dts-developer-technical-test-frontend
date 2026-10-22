import { describe, test, expect, vi } from 'vitest'

import { taskCreateTitle } from './index.js'
import { titleController } from './controller.js'

describe('taskCreateTitle plugin', () => {
  test('registers GET and POST /tasks/new/title', () => {
    const server = { route: vi.fn() }

    taskCreateTitle.plugin.register(server)

    const [routes] = server.route.mock.calls[0]
    expect(taskCreateTitle.plugin.name).toBe('Tasks - Create - Title')
    expect(routes.map((r) => `${r.method} ${r.path}`)).toEqual([
      'GET /tasks/new/title',
      'POST /tasks/new/title'
    ])
    expect(routes[0].options.handler).toBe(titleController.getHandler)
    expect(routes[1].options.handler).toBe(titleController.postHandler)
  })
})
