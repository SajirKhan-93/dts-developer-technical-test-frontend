import { ROUTES } from '../../../../common/constants/routes.js'
import { requireTitle } from '../helpers/journey.js'
import { descriptionController } from './controller.js'

export const taskCreateDescription = {
  plugin: {
    name: 'Tasks - Create - Description',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.TASKS.CREATE.DESCRIPTION,
          options: {
            pre: [requireTitle],
            handler: descriptionController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.TASKS.CREATE.DESCRIPTION,
          options: {
            pre: [requireTitle],
            handler: descriptionController.postHandler
          }
        }
      ])
    }
  }
}
