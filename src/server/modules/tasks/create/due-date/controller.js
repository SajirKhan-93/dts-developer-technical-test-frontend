import { TASK_VIEWS } from '../../../../common/constants/tasks.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { parseDueDateTime } from '../../../../common/helpers/due-date.js'
import { buildFieldErrors } from '../../helpers/task-view.js'
import {
  getBackLink,
  getSessionData,
  redirectToNextStep,
  updateSessionData
} from '../helpers/journey.js'

// Which input an error summary link should focus
const ERROR_HREFS = { dueDate: 'dueDate-day', dueTime: 'dueTime' }

class DueDateController {
  _view(request, h, formData, errors = {}) {
    return h.view(TASK_VIEWS.CREATE_DUE_DATE, {
      formData,
      backLink: getBackLink(request, ROUTES.TASKS.CREATE.STATUS),
      ...buildFieldErrors(errors, ERROR_HREFS)
    })
  }

  async get(request, h) {
    const { dueDate = {}, dueTime = '' } = getSessionData(request)

    return this._view(request, h, {
      'dueDate-day': dueDate.day ?? '',
      'dueDate-month': dueDate.month ?? '',
      'dueDate-year': dueDate.year ?? '',
      dueTime
    })
  }

  async post(request, h) {
    const payload = request.payload ?? {}
    const day = payload['dueDate-day'] ?? ''
    const month = payload['dueDate-month'] ?? ''
    const year = payload['dueDate-year'] ?? ''
    const dueTime = payload.dueTime ?? ''

    const due = parseDueDateTime({ day, month, year, time: dueTime })

    if (due.errors) {
      return this._view(
        request,
        h,
        {
          'dueDate-day': day,
          'dueDate-month': month,
          'dueDate-year': year,
          dueTime
        },
        due.errors
      )
    }

    updateSessionData(request, {
      dueDate: { day: day.trim(), month: month.trim(), year: year.trim() },
      dueTime: dueTime.trim(),
      dueDateTime: due.value
    })

    return redirectToNextStep(request, h, ROUTES.TASKS.CREATE.CHECK_ANSWERS)
  }
}

const controller = new DueDateController()

export const dueDateController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
