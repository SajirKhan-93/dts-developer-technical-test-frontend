import { describe, test, expect, vi } from 'vitest'

import { taskDelete } from './index.js'
import { deleteController } from './controller.js'
import { idParamFailAction } from '../helpers/task-view.js'

describe('taskDelete plugin', () => {
  test('registers GET and POST /tasks/{id}/delete with id validation', () => {
    const server = { route: vi.fn() }

    taskDelete.plugin.register(server)

    const [routes] = server.route.mock.calls[0]
    expect(taskDelete.plugin.name).toBe('Tasks - Delete')
    expect(routes.map((r) => `${r.method} ${r.path}`)).toEqual([
      'GET /tasks/{id}/delete',
      'POST /tasks/{id}/delete'
    ])
    expect(routes[0].options.handler).toBe(deleteController.getHandler)
    expect(routes[1].options.handler).toBe(deleteController.postHandler)
    expect(
      routes.every((r) => r.options.validate.failAction === idParamFailAction)
    ).toBe(true)
  })
})
