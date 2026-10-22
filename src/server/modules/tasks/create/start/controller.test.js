import { describe, test, expect, vi } from 'vitest'

import { taskCreateStart } from './index.js'
import { startController } from './controller.js'
import {
  buildH,
  buildRequest
} from '../../../../common/test-helpers/hapi-mocks.js'

describe('startController', () => {
  test('drops any earlier answers and goes to the title page', async () => {
    const request = buildRequest({ session: { newTask: { title: 'Old' } } })
    const h = buildH()

    await startController.getHandler(request, h)

    expect(request.yar.clear).toHaveBeenCalledWith('newTask')
    expect(request.yar.get('newTask')).toBeUndefined()
    expect(h.redirect).toHaveBeenCalledWith('/tasks/new/title')
  })
})

describe('taskCreateStart plugin', () => {
  test('registers GET /tasks/new', () => {
    const server = { route: vi.fn() }

    taskCreateStart.plugin.register(server)

    const [routes] = server.route.mock.calls[0]
    expect(taskCreateStart.plugin.name).toBe('Tasks - Create - Start')
    expect(routes).toHaveLength(1)
    expect(routes[0].method).toBe('GET')
    expect(routes[0].path).toBe('/tasks/new')
    expect(routes[0].options.handler).toBe(startController.getHandler)
  })
})
