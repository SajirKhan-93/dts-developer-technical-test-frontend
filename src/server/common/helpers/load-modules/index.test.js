import { describe, test, expect, vi } from 'vitest'
import { fileURLToPath } from 'node:url'
import { loadModules } from './index.js'

const modulesDir = fileURLToPath(new URL('../../../modules', import.meta.url))

describe('loadModules', () => {
  test('registers the plugin exported by each module', async () => {
    const server = { register: vi.fn(), logger: { warn: vi.fn() } }

    await loadModules(server, modulesDir, ['health'])

    expect(server.register).toHaveBeenCalledTimes(1)
    expect(server.register.mock.calls[0][0][0].plugin.name).toBe('health')
  })

  test('warns and continues when a module cannot be loaded', async () => {
    const server = { register: vi.fn(), logger: { warn: vi.fn() } }

    await loadModules(server, '/does/not/exist', ['nope'])

    expect(server.logger.warn).toHaveBeenCalled()
    expect(server.register).not.toHaveBeenCalled()
  })
})
