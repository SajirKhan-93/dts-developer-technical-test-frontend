import { ROUTES } from '../../../../common/constants/routes.js'
import { requireTitleAndStatus } from '../helpers/journey.js'
import { dueDateController } from './controller.js'

export const taskCreateDueDate = {
  plugin: {
    name: 'Tasks - Create - Due date',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.TASKS.CREATE.DUE_DATE,
          options: {
            pre: [requireTitleAndStatus],
            handler: dueDateController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.TASKS.CREATE.DUE_DATE,
          options: {
            pre: [requireTitleAndStatus],
            handler: dueDateController.postHandler
          }
        }
      ])
    }
  }
}
