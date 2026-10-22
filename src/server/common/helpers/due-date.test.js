import { describe, test, expect } from 'vitest'
import { isOverdue, parseDueDateTime } from './due-date.js'

describe('parseDueDateTime', () => {
  test('builds the backend date-time from valid input', () => {
    expect(
      parseDueDateTime({ day: '7', month: '3', year: '2027', time: '9:05' })
    ).toEqual({ value: '2027-03-07T09:05:00' })
  })

  test('requires a date', () => {
    expect(
      parseDueDateTime({ day: '', month: '', year: '', time: '10:00' })
    ).toEqual({ errors: { dueDate: 'TASK_DUE_DATE_REQUIRED' } })
  })

  test('reports both the date and the time when both are missing', () => {
    expect(
      parseDueDateTime({ day: '', month: '', year: '', time: '' })
    ).toEqual({
      errors: {
        dueDate: 'TASK_DUE_DATE_REQUIRED',
        dueTime: 'TASK_DUE_TIME_REQUIRED'
      }
    })
  })

  test('reports an invalid date and an invalid time together', () => {
    expect(
      parseDueDateTime({ day: '31', month: '2', year: '2027', time: '25:00' })
    ).toEqual({
      errors: {
        dueDate: 'TASK_DUE_DATE_INVALID',
        dueTime: 'TASK_DUE_TIME_INVALID'
      }
    })
  })

  test.each([
    ['31', '2', '2027'],
    ['aa', '2', '2027'],
    ['1', '13', '2027'],
    ['1', '1', '27'],
    ['1', '', '2027']
  ])('rejects the invalid date %s/%s/%s', (day, month, year) => {
    expect(parseDueDateTime({ day, month, year, time: '10:00' })).toEqual({
      errors: { dueDate: 'TASK_DUE_DATE_INVALID' }
    })
  })

  test('requires a time', () => {
    expect(
      parseDueDateTime({ day: '1', month: '1', year: '2027', time: ' ' })
    ).toEqual({ errors: { dueTime: 'TASK_DUE_TIME_REQUIRED' } })
  })

  test.each(['25:00', '10:60', '1030', 'noon'])(
    'rejects the invalid time "%s"',
    (time) => {
      expect(
        parseDueDateTime({ day: '1', month: '1', year: '2027', time })
      ).toEqual({ errors: { dueTime: 'TASK_DUE_TIME_INVALID' } })
    }
  )

  test('accepts a leap day', () => {
    expect(
      parseDueDateTime({ day: '29', month: '2', year: '2028', time: '00:00' })
        .value
    ).toBe('2028-02-29T00:00:00')
  })
})

describe('isOverdue', () => {
  // 12:00 local wall-clock time on 1 June 2026, whatever the machine timezone
  const now = new Date(2026, 5, 1, 12, 0, 0)

  test('is overdue when due in the past and not completed', () => {
    expect(isOverdue('2026-05-31T12:00:00', false, now)).toBe(true)
  })

  test('is not overdue when due in the future', () => {
    expect(isOverdue('2026-06-02T12:00:00', false, now)).toBe(false)
  })

  test('completed tasks are never overdue', () => {
    expect(isOverdue('2026-05-31T12:00:00', true, now)).toBe(false)
  })

  test('is not overdue for an unreadable date', () => {
    expect(isOverdue('garbage', false, now)).toBe(false)
  })
})
