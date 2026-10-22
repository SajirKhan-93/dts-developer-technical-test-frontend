import { describe, test, expect } from 'vitest'

import { config } from './config.js'

describe('config', () => {
  test('has the expected server defaults', () => {
    expect(config.get('host')).toBe('0.0.0.0')
    expect(config.get('port')).toBe(3000)
    expect(config.get('serviceName')).toBe('HMCTS Task Manager')
    expect(config.get('assetPath')).toBe('/assets')
  })

  test('knows it is running under test', () => {
    expect(config.get('isTest')).toBe(true)
    expect(config.get('isProduction')).toBe(false)
    expect(config.get('isDevelopment')).toBe(false)
    expect(config.get('log.enabled')).toBe(false)
  })

  test('only uses Secure cookies in production', () => {
    expect(config.get('secureCookies')).toBe(false)
  })

  test('points at the backend', () => {
    expect(config.get('backendApi')).toEqual({
      baseUrl: 'http://localhost:3001',
      timeoutMs: 5000
    })
  })

  test('has a session cookie setup', () => {
    expect(config.get('session.cookie.ttl')).toBe(3600000)
    expect(config.get('session.cookie.password').length).toBeGreaterThanOrEqual(
      32
    )
  })

  test('recompiles templates in development, caches them in production', () => {
    expect(config.get('nunjucks.watch')).toBe(false)
    expect(config.get('nunjucks.noCache')).toBe(true)
  })
})
