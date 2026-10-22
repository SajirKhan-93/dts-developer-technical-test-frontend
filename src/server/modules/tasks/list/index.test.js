import { describe, test, expect, vi } from 'vitest'

import { taskList } from './index.js'
import { listController } from './controller.js'

describe('taskList plugin', () => {
  test('is named', () => {
    expect(taskList.plugin.name).toBe('Tasks - List')
  })

  test('registers GET / with the list handler', () => {
    const server = { route: vi.fn() }

    taskList.plugin.register(server)

    const [routes] = server.route.mock.calls[0]
    expect(routes).toHaveLength(1)
    expect(routes[0].method).toBe('GET')
    expect(routes[0].path).toBe('/')
    expect(routes[0].options.handler).toBe(listController.getHandler)
  })
})
