import { SEARCH_MAX_LENGTH } from '../../../common/constants/common.js'

/**
 * Reads the title search from the listing's query string.
 * An over-long search is shortened and reported so the page still renders.
 *
 * @param {Object} request - Hapi request object
 * @returns {{ filters: { search: string }, searchError?: string }}
 */
export function buildListingRequestContext(request) {
  const rawSearch =
    typeof request.query.search === 'string' ? request.query.search.trim() : ''

  if (rawSearch.length > SEARCH_MAX_LENGTH) {
    return {
      filters: { search: rawSearch.slice(0, SEARCH_MAX_LENGTH) },
      searchError: 'TASK_SEARCH_TOO_LONG'
    }
  }

  return { filters: { search: rawSearch } }
}
