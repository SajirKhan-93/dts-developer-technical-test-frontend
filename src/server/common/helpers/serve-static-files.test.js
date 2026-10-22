import { describe, test, expect, vi } from 'vitest'
import path from 'node:path'

import { serveStaticFiles } from './serve-static-files.js'
import { govukFrontendDist } from '../../../config/nunjucks/nunjucks.js'
import { buildH } from '../test-helpers/hapi-mocks.js'

const govukDir = path.join(govukFrontendDist, 'govuk')

const registerRoutes = () => {
  const server = { route: vi.fn() }
  serveStaticFiles(server)
  return server.route.mock.calls[0][0]
}

describe('serveStaticFiles', () => {
  test('serves GOV.UK Frontend CSS and JS from /public', () => {
    const [publicRoute] = registerRoutes()

    expect(publicRoute.method).toBe('GET')
    expect(publicRoute.path).toBe('/public/{param*}')
    expect(publicRoute.handler.directory.path).toBe(govukDir)
  })

  test('serves fonts and images from /assets', () => {
    const [, assetsRoute] = registerRoutes()

    expect(assetsRoute.path).toBe('/assets/{param*}')
    expect(assetsRoute.handler.directory.path).toBe(
      path.join(govukDir, 'assets')
    )
  })

  test('does not cache files outside production', () => {
    const [publicRoute, assetsRoute] = registerRoutes()

    expect(publicRoute.options.cache).toBe(false)
    expect(assetsRoute.options.cache).toBe(false)
  })

  test('serves the favicon', () => {
    const [, , favicon] = registerRoutes()
    const h = buildH()

    favicon.handler({}, h)

    expect(favicon.path).toBe('/favicon.ico')
    expect(h.file).toHaveBeenCalledWith(
      path.join(govukDir, 'assets', 'images', 'favicon.ico')
    )
  })
})
