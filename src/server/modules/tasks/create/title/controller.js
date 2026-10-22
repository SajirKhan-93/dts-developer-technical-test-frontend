import { TASK_VIEWS } from '../../../../common/constants/tasks.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { checkTaskTitle } from '../../../../common/services/task/task-service.js'
import {
  buildFieldErrors,
  getApiErrorCode,
  mapApiValidationErrors
} from '../../helpers/task-view.js'
import { validateTitle } from '../../schema.js'
import {
  getBackLink,
  getSessionData,
  redirectToNextStep,
  updateSessionData
} from '../helpers/journey.js'

class TitleController {
  _view(request, h, title, errors = {}) {
    return h.view(TASK_VIEWS.CREATE_TITLE, {
      formData: { title },
      backLink: getBackLink(request, ROUTES.TASKS.LIST),
      ...buildFieldErrors(errors)
    })
  }

  async get(request, h) {
    return this._view(request, h, getSessionData(request).title ?? '')
  }

  async post(request, h) {
    const enteredTitle = request.payload?.title ?? ''
    const { value, errors } = validateTitle(request.payload ?? {})

    if (Object.keys(errors).length > 0) {
      return this._view(request, h, enteredTitle, errors)
    }

    // Titles must be unique, so ask the backend before moving on
    const result = await checkTaskTitle(value.title)

    if (!result.success) {
      const apiErrors = result.validationErrors
        ? mapApiValidationErrors(result.validationErrors)
        : { title: getApiErrorCode(result) }

      return this._view(request, h, enteredTitle, apiErrors)
    }

    updateSessionData(request, { title: value.title })

    return redirectToNextStep(request, h, ROUTES.TASKS.CREATE.DESCRIPTION)
  }
}

const controller = new TitleController()

export const titleController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
