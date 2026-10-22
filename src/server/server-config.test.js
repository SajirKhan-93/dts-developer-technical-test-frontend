import { describe, test, expect } from 'vitest'

import { collectProductionCookieErrors } from './server.js'

const INSECURE = 'the-password-must-be-at-least-32-characters-long'

describe('collectProductionCookieErrors', () => {
  const getValue = (password) => (key) =>
    key === 'session.cookie.password' ? password : undefined

  test('has no complaints outside production', () => {
    expect(collectProductionCookieErrors(false, getValue(INSECURE))).toEqual([])
  })

  test('rejects the built-in default password in production', () => {
    expect(collectProductionCookieErrors(true, getValue(INSECURE))).toEqual([
      'SESSION_COOKIE_PASSWORD must be changed from the insecure default value in production'
    ])
  })

  test('rejects a missing password in production', () => {
    expect(collectProductionCookieErrors(true, getValue(''))).toHaveLength(1)
  })

  test('accepts a real password in production', () => {
    expect(
      collectProductionCookieErrors(
        true,
        getValue('a-long-random-password-for-production-use')
      )
    ).toEqual([])
  })
})
