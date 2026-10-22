import { describe, test, expect } from 'vitest'

import { context } from './context.js'

describe('context', () => {
  test('gives every view the service details and a translator', () => {
    const result = context({ plugins: { crumb: 'token' } })

    expect(result.assetPath).toBe('/assets')
    expect(result.serviceName).toBe('HMCTS Task Manager')
    expect(result.serviceUrl).toBe('/')
    expect(result.t('tasks.list.heading')).toBe('Tasks')
  })

  test('passes the CSRF token to forms', () => {
    expect(context({ plugins: { crumb: 'abc' } }).crumb).toBe('abc')
  })

  test('copes with a request that has no CSRF token', () => {
    expect(context({}).crumb).toBe('')
  })

  test('gives views the request', () => {
    const request = { path: '/tasks', plugins: {} }

    expect(context(request).request).toBe(request)
  })

  test('translations fall back to the key', () => {
    expect(context({}).t('nope.missing')).toBe('nope.missing')
  })
})

describe('nunjucks environment', () => {
  test('finds the GOV.UK templates and renders with the filters and globals', async () => {
    const nunjucks = (await import('nunjucks')).default
    await import('../nunjucks.js')

    const rendered = nunjucks.renderString(
      '{{ date | formatDateTime }} | {{ TASK_STATUS_TAG_CLASS.TODO }}',
      { date: '2026-11-30T17:00:00' }
    )

    expect(rendered).toBe('30 November 2026, 17:00 | govuk-tag--grey')
  })
})
