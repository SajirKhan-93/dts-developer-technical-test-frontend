import { TASK_VIEWS } from '../../../common/constants/tasks.js'
import { getTask } from '../../../common/services/task/task-service.js'
import {
  buildFieldErrors,
  buildStatusItems,
  consumeNotice,
  renderBackendError,
  toViewModel
} from '../helpers/task-view.js'

class ViewController {
  /**
   * Renders the task page. errors is { field: errorCode } for the status form.
   */
  async render(request, h, errors = {}) {
    const result = await getTask(request.params.id)

    if (!result.success) {
      return renderBackendError(h, result)
    }

    const task = toViewModel(result.data)

    return h.view(TASK_VIEWS.VIEW, {
      task,
      notice: consumeNotice(request),
      statusItems: buildStatusItems(task.status),
      ...buildFieldErrors(errors)
    })
  }

  async get(request, h) {
    return this.render(request, h)
  }
}

const controller = new ViewController()

export const viewController = {
  getHandler: (request, h) => controller.get(request, h),
  render: (request, h, errors) => controller.render(request, h, errors)
}
