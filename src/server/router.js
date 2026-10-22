import inert from '@hapi/inert'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { loadModules } from './common/helpers/load-modules/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

const fileName = fileURLToPath(import.meta.url)
const dirName = dirname(fileName)

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route
      await loadModules(server, join(dirName, 'modules'), ['health'])

      // Task routes
      await loadModules(server, join(dirName, 'modules/tasks'), [
        'list',
        'create/start',
        'create/title',
        'create/description',
        'create/status',
        'create/due-date',
        'create/check-answers',
        'view',
        'update-status',
        'delete'
      ])

      // Static files (GOV.UK Frontend CSS, JS, fonts and images)
      serveStaticFiles(server)
    }
  }
}
