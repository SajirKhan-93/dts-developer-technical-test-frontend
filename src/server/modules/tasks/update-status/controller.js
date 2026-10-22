import { ROUTES, taskPath } from '../../../common/constants/routes.js'
import { updateTaskStatus } from '../../../common/services/task/task-service.js'
import {
  getApiErrorCode,
  renderBackendError,
  setNotice
} from '../helpers/task-view.js'
import { validateStatus } from '../schema.js'
import { viewController } from '../view/controller.js'

class UpdateStatusController {
  async post(request, h) {
    const { value, errors } = validateStatus(request.payload ?? {})

    if (Object.keys(errors).length > 0) {
      return viewController.render(request, h, errors)
    }

    const result = await updateTaskStatus(request.params.id, value.status)

    if (!result.success) {
      if (result.validationErrors) {
        return viewController.render(request, h, {
          status: getApiErrorCode({
            errors: result.validationErrors
          })
        })
      }
      return renderBackendError(h, result)
    }

    setNotice(request, 'status_updated')
    return h.redirect(taskPath(ROUTES.TASKS.VIEW, request.params.id))
  }
}

const controller = new UpdateStatusController()

export const updateStatusController = {
  postHandler: (request, h) => controller.post(request, h)
}
