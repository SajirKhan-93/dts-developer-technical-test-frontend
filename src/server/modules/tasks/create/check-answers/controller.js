import { TASK_VIEWS } from '../../../../common/constants/tasks.js'
import { ROUTES, taskPath } from '../../../../common/constants/routes.js'
import { createTask } from '../../../../common/services/task/task-service.js'
import { translate } from '../../../../common/locales/translate.js'
import { getApiErrorCode, setNotice } from '../../helpers/task-view.js'
import {
  changeLink,
  getSessionData,
  resetSessionData
} from '../helpers/journey.js'

const CREATE_ROUTES = ROUTES.TASKS.CREATE

// The page to send the user to so they can fix an error the backend reports
const FIELD_ROUTES = {
  title: CREATE_ROUTES.TITLE,
  description: CREATE_ROUTES.DESCRIPTION,
  status: CREATE_ROUTES.STATUS,
  dueDateTime: CREATE_ROUTES.DUE_DATE
}

function buildErrorList(result) {
  const apiErrors = result.validationErrors ?? result.errors ?? []

  return apiErrors.map((error) => {
    const route = FIELD_ROUTES[error.field]
    const code = error.errorCode ?? getApiErrorCode(result)

    return {
      text: translate(`tasks.errors.${code}`),
      ...(route && { href: changeLink(route) })
    }
  })
}

class CheckAnswersController {
  _view(request, h, errorList = []) {
    const { title, description, status, dueDateTime } = getSessionData(request)

    return h.view(TASK_VIEWS.CREATE_CHECK_ANSWERS, {
      answers: { title, description, status, dueDateTime },
      changeLinks: {
        title: changeLink(CREATE_ROUTES.TITLE),
        description: changeLink(CREATE_ROUTES.DESCRIPTION),
        status: changeLink(CREATE_ROUTES.STATUS),
        dueDateTime: changeLink(CREATE_ROUTES.DUE_DATE)
      },
      backLink: CREATE_ROUTES.DUE_DATE,
      errorList
    })
  }

  async get(request, h) {
    return this._view(request, h)
  }

  async post(request, h) {
    const { title, description, status, dueDateTime } = getSessionData(request)

    const result = await createTask({
      title,
      description: description || undefined,
      status,
      dueDateTime
    })

    if (!result.success) {
      const errorList = buildErrorList(result)

      return this._view(
        request,
        h,
        errorList.length
          ? errorList
          : [{ text: translate('tasks.errors.UNEXPECTED') }]
      )
    }

    resetSessionData(request)
    setNotice(request, 'created')

    return h.redirect(taskPath(ROUTES.TASKS.VIEW, result.data.id))
  }
}

const controller = new CheckAnswersController()

export const checkAnswersController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
