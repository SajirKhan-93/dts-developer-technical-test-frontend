import { describe, test, expect, vi } from 'vitest'

import { taskView } from './index.js'
import { viewController } from './controller.js'
import { idParamFailAction } from '../helpers/task-view.js'

describe('taskView plugin', () => {
  test('registers GET /tasks/{id} with id validation', () => {
    const server = { route: vi.fn() }

    taskView.plugin.register(server)

    const [routes] = server.route.mock.calls[0]
    expect(taskView.plugin.name).toBe('Tasks - View')
    expect(routes).toHaveLength(1)
    expect(routes[0].method).toBe('GET')
    expect(routes[0].path).toBe('/tasks/{id}')
    expect(routes[0].options.handler).toBe(viewController.getHandler)
    expect(routes[0].options.validate.params).toBeDefined()
    expect(routes[0].options.validate.failAction).toBe(idParamFailAction)
  })
})
