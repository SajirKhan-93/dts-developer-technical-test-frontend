import {
  CHANGE_FROM_CHECK_ANSWERS,
  JOURNEY_SESSION_KEY
} from '../../../../common/constants/tasks.js'
import { ROUTES } from '../../../../common/constants/routes.js'

const CREATE_ROUTES = ROUTES.TASKS.CREATE

// The answers a task cannot be created without, in the order they are asked
const REQUIRED_ANSWERS = [
  { field: 'title', route: CREATE_ROUTES.TITLE },
  { field: 'status', route: CREATE_ROUTES.STATUS },
  { field: 'dueDateTime', route: CREATE_ROUTES.DUE_DATE }
]

export function getSessionData(request) {
  return request.yar.get(JOURNEY_SESSION_KEY) ?? {}
}

export function updateSessionData(request, data) {
  request.yar.set(JOURNEY_SESSION_KEY, { ...getSessionData(request), ...data })
}

export function resetSessionData(request) {
  request.yar.clear(JOURNEY_SESSION_KEY)
}

/** True when the user came from a Change link on the check answers page */
export function isChangeMode(request) {
  return request.query.from === CHANGE_FROM_CHECK_ANSWERS
}

/** The URL of a step reached through a Change link */
export function changeLink(route) {
  return `${route}?from=${CHANGE_FROM_CHECK_ANSWERS}`
}

export function getBackLink(request, previousRoute) {
  return isChangeMode(request) ? CREATE_ROUTES.CHECK_ANSWERS : previousRoute
}

/** Moves on to the next question, or straight back to check answers when changing an answer */
export function redirectToNextStep(request, h, nextRoute) {
  return h.redirect(
    isChangeMode(request) ? CREATE_ROUTES.CHECK_ANSWERS : nextRoute
  )
}

/**
 * Hapi pre-handler factory: sends the user back to the first question that is
 * still unanswered among the given answers (for example after a session expires).
 */
function requireAnswers(...fields) {
  return {
    method: (request, h) => {
      const answers = getSessionData(request)
      const missing = REQUIRED_ANSWERS.find(
        ({ field }) => fields.includes(field) && !answers[field]
      )

      return missing ? h.redirect(missing.route).takeover() : h.continue
    }
  }
}

export const requireTitle = requireAnswers('title')
export const requireTitleAndStatus = requireAnswers('title', 'status')
export const requireAllAnswers = requireAnswers(
  'title',
  'status',
  'dueDateTime'
)
