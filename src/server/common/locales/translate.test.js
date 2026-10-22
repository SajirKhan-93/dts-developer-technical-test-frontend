import { describe, test, expect } from 'vitest'
import { translate } from './translate.js'

describe('translate', () => {
  test('returns the message for a dotted key', () => {
    expect(translate('tasks.errors.TASK_TITLE_REQUIRED')).toBe('Enter a title')
  })

  test('falls back to the key when missing', () => {
    expect(translate('tasks.errors.NOPE')).toBe('tasks.errors.NOPE')
  })

  test('falls back to the key when the key points at a group', () => {
    expect(translate('tasks.errors')).toBe('tasks.errors')
  })
})
