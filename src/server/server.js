import hapi from '@hapi/hapi'
import Crumb from '@hapi/crumb'
import Yar from '@hapi/yar'

import { router } from './router.js'
import { config } from '../config/config.js'
import { catchAll } from './common/helpers/errors.js'
import { noCacheHeaders } from './common/helpers/no-cache-headers.js'
import { nunjucksConfig } from '../config/nunjucks/nunjucks.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'

const INSECURE_COOKIE_DEFAULT =
  'the-password-must-be-at-least-32-characters-long'

export function collectProductionCookieErrors(isProduction, getConfigValue) {
  if (!isProduction) {
    return []
  }
  const cookiePassword = getConfigValue('session.cookie.password')
  if (!cookiePassword || cookiePassword === INSECURE_COOKIE_DEFAULT) {
    return [
      'SESSION_COOKIE_PASSWORD must be changed from the insecure default value in production'
    ]
  }
  return []
}

function validateProductionConfig() {
  const errors = collectProductionCookieErrors(
    config.get('isProduction'),
    (key) => config.get(key)
  )
  if (errors.length > 0) {
    throw new Error(`Server startup aborted — ${errors.join(', ')}`)
  }
}

function buildServerConfig() {
  return {
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false,
          allowUnknown: true // permits the 'crumb' CSRF token field in all POST payloads
        }
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    },
    state: {
      strictHeader: false
    }
  }
}

async function registerPlugins(server) {
  await server.register([
    requestLogger,
    {
      plugin: Yar,
      options: {
        storeBlank: false,
        // Answers (such as a 2,000 character description) are kept on the server, not in the cookie
        maxCookieSize: 0,
        cache: { expiresIn: config.get('session.cookie.ttl') },
        cookieOptions: {
          password: config.get('session.cookie.password'),
          ttl: config.get('session.cookie.ttl'),
          isSecure: config.get('secureCookies'),
          isHttpOnly: true,
          isSameSite: 'Lax'
        }
      }
    },
    nunjucksConfig,
    {
      plugin: Crumb,
      options: {
        cookieOptions: {
          isSecure: config.get('secureCookies'),
          isHttpOnly: true,
          isSameSite: 'Strict'
        }
      }
    },
    router // Register all the controllers/routes defined in src/server/router.js
  ])
}

export async function createServer() {
  validateProductionConfig()
  const server = hapi.server(buildServerConfig())
  await registerPlugins(server)
  server.ext('onPreResponse', catchAll)
  server.ext('onPreResponse', noCacheHeaders)
  return server
}
