export const ROUTES = {
  HEALTH: '/health',
  GENERAL: {
    HOME: '/'
  },
  TASKS: {
    LIST: '/',
    CREATE: {
      START: '/tasks/new',
      TITLE: '/tasks/new/title',
      DESCRIPTION: '/tasks/new/description',
      STATUS: '/tasks/new/status',
      DUE_DATE: '/tasks/new/due-date',
      CHECK_ANSWERS: '/tasks/new/check-answers'
    },
    VIEW: '/tasks/{id}',
    UPDATE_STATUS: '/tasks/{id}/status',
    DELETE: '/tasks/{id}/delete'
  }
}

/** Builds a concrete path from a route pattern, e.g. taskPath(ROUTES.TASKS.VIEW, 3) */
export function taskPath(pattern, id) {
  return pattern.replace('{id}', encodeURIComponent(String(id)))
}
