import { describe, test, expect, vi } from 'vitest'

import { taskUpdateStatus } from './index.js'
import { updateStatusController } from './controller.js'
import { idParamFailAction } from '../helpers/task-view.js'

describe('taskUpdateStatus plugin', () => {
  test('registers POST /tasks/{id}/status with id validation', () => {
    const server = { route: vi.fn() }

    taskUpdateStatus.plugin.register(server)

    const [routes] = server.route.mock.calls[0]
    expect(taskUpdateStatus.plugin.name).toBe('Tasks - Update status')
    expect(routes).toHaveLength(1)
    expect(routes[0].method).toBe('POST')
    expect(routes[0].path).toBe('/tasks/{id}/status')
    expect(routes[0].options.handler).toBe(updateStatusController.postHandler)
    expect(routes[0].options.validate.failAction).toBe(idParamFailAction)
  })
})
