import { describe, test, expect, vi } from 'vitest'

import { taskCreateDescription } from './index.js'
import { descriptionController } from './controller.js'
import { requireTitle } from '../helpers/journey.js'

describe('taskCreateDescription plugin', () => {
  test('registers GET and POST /tasks/new/description, once a title exists', () => {
    const server = { route: vi.fn() }

    taskCreateDescription.plugin.register(server)

    const [routes] = server.route.mock.calls[0]
    expect(taskCreateDescription.plugin.name).toBe(
      'Tasks - Create - Description'
    )
    expect(routes.map((r) => `${r.method} ${r.path}`)).toEqual([
      'GET /tasks/new/description',
      'POST /tasks/new/description'
    ])
    expect(routes[0].options.handler).toBe(descriptionController.getHandler)
    expect(routes[1].options.handler).toBe(descriptionController.postHandler)
    expect(routes.every((r) => r.options.pre[0] === requireTitle)).toBe(true)
  })
})
