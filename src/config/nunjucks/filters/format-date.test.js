import { describe, test, expect } from 'vitest'
import { formatDateTime } from './format-date.js'

describe('formatDateTime', () => {
  test('formats a backend date-time for display', () => {
    expect(formatDateTime('2026-11-30T17:00:00')).toBe(
      '30 November 2026, 17:00'
    )
  })

  test('returns unrecognised input unchanged', () => {
    expect(formatDateTime('not a date')).toBe('not a date')
  })

  test('returns an empty string for undefined', () => {
    expect(formatDateTime(undefined)).toBe('')
  })
})
