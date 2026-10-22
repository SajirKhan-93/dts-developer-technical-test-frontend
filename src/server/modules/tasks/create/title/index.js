import { ROUTES } from '../../../../common/constants/routes.js'
import { titleController } from './controller.js'

export const taskCreateTitle = {
  plugin: {
    name: 'Tasks - Create - Title',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.TASKS.CREATE.TITLE,
          options: {
            handler: titleController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.TASKS.CREATE.TITLE,
          options: {
            handler: titleController.postHandler
          }
        }
      ])
    }
  }
}
