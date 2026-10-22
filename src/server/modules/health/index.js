import { ROUTES } from '../../common/constants/routes.js'
import { statusCodes } from '../../common/constants/status-codes.js'

/**
 * Sets up the health check route.
 * These routes are registered in src/server/router.js.
 */
export const health = {
  plugin: {
    name: 'health',
    register(server) {
      server.route({
        method: 'GET',
        path: ROUTES.HEALTH,
        handler: (_request, h) =>
          h.response({ message: 'success' }).code(statusCodes.ok),
        options: { plugins: { crumb: false } }
      })
    }
  }
}
