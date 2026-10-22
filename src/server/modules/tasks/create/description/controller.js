import { TASK_VIEWS } from '../../../../common/constants/tasks.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { buildFieldErrors } from '../../helpers/task-view.js'
import { validateDescription } from '../../schema.js'
import {
  getBackLink,
  getSessionData,
  redirectToNextStep,
  updateSessionData
} from '../helpers/journey.js'

class DescriptionController {
  _view(request, h, description, errors = {}) {
    return h.view(TASK_VIEWS.CREATE_DESCRIPTION, {
      formData: { description },
      backLink: getBackLink(request, ROUTES.TASKS.CREATE.TITLE),
      ...buildFieldErrors(errors)
    })
  }

  async get(request, h) {
    return this._view(request, h, getSessionData(request).description ?? '')
  }

  async post(request, h) {
    const enteredDescription = request.payload?.description ?? ''
    const { value, errors } = validateDescription(request.payload ?? {})

    if (Object.keys(errors).length > 0) {
      return this._view(request, h, enteredDescription, errors)
    }

    updateSessionData(request, { description: value.description })

    return redirectToNextStep(request, h, ROUTES.TASKS.CREATE.STATUS)
  }
}

const controller = new DescriptionController()

export const descriptionController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
