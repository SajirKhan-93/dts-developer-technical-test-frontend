import { describe, test, expect, vi } from 'vitest'

import { taskCreateCheckAnswers } from './index.js'
import { checkAnswersController } from './controller.js'
import { requireAllAnswers } from '../helpers/journey.js'

describe('taskCreateCheckAnswers plugin', () => {
  test('registers GET and POST /tasks/new/check-answers, once everything is answered', () => {
    const server = { route: vi.fn() }

    taskCreateCheckAnswers.plugin.register(server)

    const [routes] = server.route.mock.calls[0]
    expect(taskCreateCheckAnswers.plugin.name).toBe(
      'Tasks - Create - Check answers'
    )
    expect(routes.map((r) => `${r.method} ${r.path}`)).toEqual([
      'GET /tasks/new/check-answers',
      'POST /tasks/new/check-answers'
    ])
    expect(routes[0].options.handler).toBe(checkAnswersController.getHandler)
    expect(routes[1].options.handler).toBe(checkAnswersController.postHandler)
    expect(routes.every((r) => r.options.pre[0] === requireAllAnswers)).toBe(
      true
    )
  })
})
