import { ROUTES } from '../../../../common/constants/routes.js'
import { startController } from './controller.js'

export const taskCreateStart = {
  plugin: {
    name: 'Tasks - Create - Start',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.TASKS.CREATE.START,
          options: {
            handler: startController.getHandler
          }
        }
      ])
    }
  }
}
