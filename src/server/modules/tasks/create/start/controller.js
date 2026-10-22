import { ROUTES } from '../../../../common/constants/routes.js'
import { resetSessionData } from '../helpers/journey.js'

class StartController {
  // Each visit begins a new task, so any answers from an earlier one are dropped
  async get(request, h) {
    resetSessionData(request)

    return h.redirect(ROUTES.TASKS.CREATE.TITLE)
  }
}

const controller = new StartController()

export const startController = {
  getHandler: (request, h) => controller.get(request, h)
}
