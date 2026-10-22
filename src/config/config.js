import convict from 'convict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import convictFormatWithValidator from 'convict-format-with-validator'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'
const isDevelopment = process.env.NODE_ENV === 'development'

convict.addFormats(convictFormatWithValidator)

export const config = convict({
  serviceVersion: {
    doc: 'The service version',
    format: String,
    nullable: true,
    default: null,
    env: 'SERVICE_VERSION'
  },
  host: {
    doc: 'The IP address to bind',
    format: 'ipaddress',
    default: '0.0.0.0',
    env: 'HOST'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3000,
    env: 'PORT'
  },
  serviceName: {
    doc: 'Applications Service Name',
    format: String,
    default: 'HMCTS Task Manager'
  },
  root: {
    doc: 'Project root',
    format: String,
    default: path.resolve(dirname, '../..')
  },
  assetPath: {
    doc: 'Path the GOV.UK Frontend assets (fonts, images) are served from',
    format: String,
    default: '/assets',
    env: 'ASSET_PATH'
  },
  isProduction: {
    doc: 'If this application running in the production environment',
    format: Boolean,
    default: isProduction
  },
  isDevelopment: {
    doc: 'If this application running in the development environment',
    format: Boolean,
    default: isDevelopment
  },
  isTest: {
    doc: 'If this application running in the test environment',
    format: Boolean,
    default: isTest
  },
  secureCookies: {
    doc: 'Send cookies with the Secure flag (requires HTTPS). Set false to run production mode over plain http locally',
    format: Boolean,
    default: isProduction,
    env: 'SECURE_COOKIES'
  },
  log: {
    enabled: {
      doc: 'Is logging enabled',
      format: Boolean,
      default: !isTest,
      env: 'LOG_ENABLED'
    },
    level: {
      doc: 'Logging level',
      format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
      env: 'LOG_LEVEL'
    },
    format: {
      doc: 'Format to output logs in.',
      format: ['json', 'pino-pretty'],
      default: isProduction ? 'json' : 'pino-pretty',
      env: 'LOG_FORMAT'
    },
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers'
      ]
    }
  },
  session: {
    cookie: {
      password: {
        doc: 'Password used to encrypt the session cookie (min 32 characters)',
        format: String,
        default: 'the-password-must-be-at-least-32-characters-long',
        sensitive: true,
        env: 'SESSION_COOKIE_PASSWORD'
      },
      ttl: {
        doc: 'Session cookie time to live in milliseconds',
        format: Number,
        default: 3600000,
        env: 'SESSION_COOKIE_TTL'
      }
    }
  },
  nunjucks: {
    watch: {
      doc: 'Reload templates when they change',
      format: Boolean,
      default: isDevelopment
    },
    noCache: {
      doc: 'Use a cache and recompile templates each time',
      format: Boolean,
      default: !isProduction
    }
  },
  backendApi: {
    baseUrl: {
      doc: 'Base URL of the tasks backend API',
      format: 'url',
      default: 'http://localhost:3001',
      env: 'BACKEND_API_URL'
    },
    timeoutMs: {
      doc: 'Milliseconds to wait for the backend before giving up',
      format: 'nat',
      default: 5000,
      env: 'BACKEND_API_TIMEOUT_MS'
    }
  }
})

config.validate({ allowed: 'strict' })
