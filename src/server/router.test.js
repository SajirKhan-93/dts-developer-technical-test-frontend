import { describe, test, expect, vi } from 'vitest'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { router } from './router.js'
import { loadModules } from './common/helpers/load-modules/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

vi.mock('./common/helpers/load-modules/index.js', () => ({
  loadModules: vi.fn()
}))
vi.mock('./common/helpers/serve-static-files.js', () => ({
  serveStaticFiles: vi.fn()
}))

const serverDir = path.dirname(
  fileURLToPath(new URL('./router.js', import.meta.url))
)

describe('router', () => {
  const register = async () => {
    const server = { register: vi.fn() }
    await router.plugin.register(server)
    return server
  }

  test('is named router', () => {
    expect(router.plugin.name).toBe('router')
  })

  test('registers inert for static files', async () => {
    const server = await register()

    expect(server.register).toHaveBeenCalledTimes(1)
  })

  test('loads the health module', async () => {
    await register()

    expect(loadModules).toHaveBeenCalledWith(
      expect.anything(),
      path.join(serverDir, 'modules'),
      ['health']
    )
  })

  test('loads every task page module', async () => {
    await register()

    expect(loadModules).toHaveBeenCalledWith(
      expect.anything(),
      path.join(serverDir, 'modules/tasks'),
      [
        'list',
        'create/start',
        'create/title',
        'create/description',
        'create/status',
        'create/due-date',
        'create/check-answers',
        'view',
        'update-status',
        'delete'
      ]
    )
  })

  test('serves the static files', async () => {
    const server = await register()

    expect(serveStaticFiles).toHaveBeenCalledWith(server)
  })
})
