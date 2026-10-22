import path from 'node:path'
import { createRequire } from 'node:module'
import nunjucks from 'nunjucks'
import hapiVision from '@hapi/vision'
import { fileURLToPath } from 'node:url'

import { config } from '../config.js'
import { context } from './context/context.js'
import * as filters from './filters/filters.js'
import * as globals from './globals/globals.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const govukFrontendDist = path.resolve(
  path.dirname(require.resolve('govuk-frontend/package.json')),
  'dist'
)

const nunjucksEnvironment = nunjucks.configure(
  [
    govukFrontendDist,
    path.resolve(dirname, '../../server/common/templates'),
    path.resolve(dirname, '../../server/common/components')
  ],
  {
    autoescape: true,
    throwOnUndefined: false,
    trimBlocks: true,
    lstripBlocks: true,
    watch: config.get('nunjucks.watch'),
    noCache: config.get('nunjucks.noCache')
  }
)

export const nunjucksConfig = {
  plugin: hapiVision,
  options: {
    engines: {
      njk: {
        compile(src, options) {
          const template = nunjucks.compile(src, options.environment)
          return (ctx) => template.render(ctx)
        }
      }
    },
    compileOptions: {
      environment: nunjucksEnvironment
    },
    relativeTo: path.resolve(dirname, '../..'),
    path: 'server',
    isCached: config.get('isProduction'),
    context
  }
}

for (const [name, global] of Object.entries(globals)) {
  nunjucksEnvironment.addGlobal(name, global)
}

for (const [name, filter] of Object.entries(filters)) {
  nunjucksEnvironment.addFilter(name, filter)
}

export { govukFrontendDist }
