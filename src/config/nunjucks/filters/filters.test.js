import { describe, test, expect } from 'vitest'

import * as filters from './filters.js'
import { formatDateTime } from './format-date.js'

describe('nunjucks filters', () => {
  test('exposes the date filter under its template name', () => {
    expect(Object.keys(filters)).toEqual(['formatDateTime'])
    expect(filters.formatDateTime).toBe(formatDateTime)
  })
})
