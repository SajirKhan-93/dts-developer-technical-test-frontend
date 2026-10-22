import { describe, test, expect } from 'vitest'
import { buildListingRequestContext } from './listing.js'

describe('buildListingRequestContext', () => {
  test('defaults to no search', () => {
    expect(buildListingRequestContext({ query: {} })).toEqual({
      filters: { search: '' }
    })
  })

  test('reads a trimmed search', () => {
    expect(
      buildListingRequestContext({ query: { search: '  bundle ' } })
    ).toEqual({ filters: { search: 'bundle' } })
  })

  test('ignores a search that is not a string', () => {
    expect(
      buildListingRequestContext({ query: { search: ['a', 'b'] } }).filters
    ).toEqual({ search: '' })
  })

  test('reports and shortens a search that is too long', () => {
    const result = buildListingRequestContext({
      query: { search: 'a'.repeat(300) }
    })

    expect(result.searchError).toBe('TASK_SEARCH_TOO_LONG')
    expect(result.filters.search).toHaveLength(255)
  })
})
