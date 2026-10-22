import { ROUTES } from '../../../common/constants/routes.js'
import { idParamFailAction } from '../helpers/task-view.js'
import { taskIdParamsSchema } from '../schema.js'
import { deleteController } from './controller.js'

export const taskDelete = {
  plugin: {
    name: 'Tasks - Delete',
    register(server) {
      const options = {
        validate: {
          params: taskIdParamsSchema,
          failAction: idParamFailAction
        }
      }

      server.route([
        {
          method: 'GET',
          path: ROUTES.TASKS.DELETE,
          options: { ...options, handler: deleteController.getHandler }
        },
        {
          method: 'POST',
          path: ROUTES.TASKS.DELETE,
          options: { ...options, handler: deleteController.postHandler }
        }
      ])
    }
  }
}
