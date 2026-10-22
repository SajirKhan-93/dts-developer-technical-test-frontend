import { ROUTES } from '../../../common/constants/routes.js'
import { listController } from './controller.js'

export const taskList = {
  plugin: {
    name: 'Tasks - List',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.TASKS.LIST,
          options: {
            handler: listController.getHandler
          }
        }
      ])
    }
  }
}
