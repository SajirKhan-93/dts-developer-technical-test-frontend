import { TASK_VIEWS } from '../../../../common/constants/tasks.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { buildFieldErrors, buildStatusItems } from '../../helpers/task-view.js'
import { validateStatus } from '../../schema.js'
import {
  getBackLink,
  getSessionData,
  redirectToNextStep,
  updateSessionData
} from '../helpers/journey.js'

class StatusController {
  _view(request, h, status, errors = {}) {
    return h.view(TASK_VIEWS.CREATE_STATUS, {
      statusItems: buildStatusItems(status),
      backLink: getBackLink(request, ROUTES.TASKS.CREATE.DESCRIPTION),
      ...buildFieldErrors(errors)
    })
  }

  async get(request, h) {
    return this._view(request, h, getSessionData(request).status)
  }

  async post(request, h) {
    const { value, errors } = validateStatus(request.payload ?? {})

    if (Object.keys(errors).length > 0) {
      return this._view(request, h, undefined, errors)
    }

    updateSessionData(request, { status: value.status })

    return redirectToNextStep(request, h, ROUTES.TASKS.CREATE.DUE_DATE)
  }
}

const controller = new StatusController()

export const statusController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
