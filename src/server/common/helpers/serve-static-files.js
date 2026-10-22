import path from 'node:path'

import { govukFrontendDist } from '../../../config/nunjucks/nunjucks.js'
import { config } from '../../../config/config.js'

/**
 * Serves the prebuilt GOV.UK Frontend CSS/JS (/public) and its fonts and
 * images (/assets) straight from node_modules, so there is no asset build step.
 */
export function serveStaticFiles(server) {
  const govukDir = path.join(govukFrontendDist, 'govuk')
  const oneWeekMs = 604800000
  const cache = config.get('isProduction')
    ? { expiresIn: oneWeekMs, privacy: 'public' }
    : false

  server.route([
    {
      method: 'GET',
      path: '/public/{param*}',
      handler: { directory: { path: govukDir, redirectToSlash: false } },
      options: { cache }
    },
    {
      method: 'GET',
      path: '/assets/{param*}',
      handler: {
        directory: {
          path: path.join(govukDir, 'assets'),
          redirectToSlash: false
        }
      },
      options: { cache }
    },
    {
      method: 'GET',
      path: '/favicon.ico',
      handler: (_request, h) =>
        h.file(path.join(govukDir, 'assets', 'images', 'favicon.ico'))
    }
  ])
}
