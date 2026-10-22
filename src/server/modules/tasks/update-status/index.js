import { ROUTES } from '../../../common/constants/routes.js'
import { idParamFailAction } from '../helpers/task-view.js'
import { taskIdParamsSchema } from '../schema.js'
import { updateStatusController } from './controller.js'

export const taskUpdateStatus = {
  plugin: {
    name: 'Tasks - Update status',
    register(server) {
      server.route([
        {
          method: 'POST',
          path: ROUTES.TASKS.UPDATE_STATUS,
          options: {
            validate: {
              params: taskIdParamsSchema,
              failAction: idParamFailAction
            },
            handler: updateStatusController.postHandler
          }
        }
      ])
    }
  }
}
