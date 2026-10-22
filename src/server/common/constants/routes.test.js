import { describe, test, expect } from 'vitest'

import { ROUTES, taskPath } from './routes.js'

describe('ROUTES', () => {
  test('lists the create journey in order', () => {
    expect(Object.values(ROUTES.TASKS.CREATE)).toEqual([
      '/tasks/new',
      '/tasks/new/title',
      '/tasks/new/description',
      '/tasks/new/status',
      '/tasks/new/due-date',
      '/tasks/new/check-answers'
    ])
  })
})

describe('taskPath', () => {
  test('fills in the task id', () => {
    expect(taskPath(ROUTES.TASKS.VIEW, 7)).toBe('/tasks/7')
    expect(taskPath(ROUTES.TASKS.UPDATE_STATUS, '7')).toBe('/tasks/7/status')
    expect(taskPath(ROUTES.TASKS.DELETE, 7)).toBe('/tasks/7/delete')
  })

  test('encodes anything unsafe in the id', () => {
    expect(taskPath(ROUTES.TASKS.VIEW, '../etc')).toBe('/tasks/..%2Fetc')
  })
})
