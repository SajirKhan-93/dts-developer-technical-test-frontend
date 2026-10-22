import { ROUTES } from '../../../common/constants/routes.js'
import { idParamFailAction } from '../helpers/task-view.js'
import { taskIdParamsSchema } from '../schema.js'
import { viewController } from './controller.js'

export const taskView = {
  plugin: {
    name: 'Tasks - View',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.TASKS.VIEW,
          options: {
            validate: {
              params: taskIdParamsSchema,
              failAction: idParamFailAction
            },
            handler: viewController.getHandler
          }
        }
      ])
    }
  }
}
