import { TASK_VIEWS } from '../../../common/constants/tasks.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  deleteTask,
  getTask
} from '../../../common/services/task/task-service.js'
import {
  renderBackendError,
  setNotice,
  toViewModel
} from '../helpers/task-view.js'

class DeleteController {
  async get(request, h) {
    const result = await getTask(request.params.id)

    if (!result.success) {
      return renderBackendError(h, result)
    }

    return h.view(TASK_VIEWS.DELETE, { task: toViewModel(result.data) })
  }

  async post(request, h) {
    const result = await deleteTask(request.params.id)

    if (!result.success) {
      return renderBackendError(h, result)
    }

    setNotice(request, 'deleted')
    return h.redirect(ROUTES.TASKS.LIST)
  }
}

const controller = new DeleteController()

export const deleteController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
