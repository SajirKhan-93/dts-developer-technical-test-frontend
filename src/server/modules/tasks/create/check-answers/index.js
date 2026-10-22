import { ROUTES } from '../../../../common/constants/routes.js'
import { requireAllAnswers } from '../helpers/journey.js'
import { checkAnswersController } from './controller.js'

export const taskCreateCheckAnswers = {
  plugin: {
    name: 'Tasks - Create - Check answers',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.TASKS.CREATE.CHECK_ANSWERS,
          options: {
            pre: [requireAllAnswers],
            handler: checkAnswersController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.TASKS.CREATE.CHECK_ANSWERS,
          options: {
            pre: [requireAllAnswers],
            handler: checkAnswersController.postHandler
          }
        }
      ])
    }
  }
}
