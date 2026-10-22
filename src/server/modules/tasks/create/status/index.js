import { ROUTES } from '../../../../common/constants/routes.js'
import { requireTitle } from '../helpers/journey.js'
import { statusController } from './controller.js'

export const taskCreateStatus = {
  plugin: {
    name: 'Tasks - Create - Status',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.TASKS.CREATE.STATUS,
          options: {
            pre: [requireTitle],
            handler: statusController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.TASKS.CREATE.STATUS,
          options: {
            pre: [requireTitle],
            handler: statusController.postHandler
          }
        }
      ])
    }
  }
}
