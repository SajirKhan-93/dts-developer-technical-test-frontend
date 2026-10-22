import { describe, test, expect, beforeEach, vi } from 'vitest'

import { startServer } from './start-server.js'
import { createServer } from '../../server.js'

vi.mock('../../server.js', () => ({ createServer: vi.fn() }))

describe('startServer', () => {
  let server

  beforeEach(() => {
    server = {
      start: vi.fn().mockResolvedValue(undefined),
      logger: { info: vi.fn() }
    }
    createServer.mockResolvedValue(server)
  })

  test('creates, starts and returns the server', async () => {
    await expect(startServer()).resolves.toBe(server)

    expect(server.start).toHaveBeenCalled()
  })

  test('logs where to find the frontend', async () => {
    await startServer()

    expect(server.logger.info).toHaveBeenCalledWith(
      'Server started successfully'
    )
    expect(server.logger.info).toHaveBeenCalledWith(
      'Access your frontend on http://localhost:3000'
    )
  })
})
