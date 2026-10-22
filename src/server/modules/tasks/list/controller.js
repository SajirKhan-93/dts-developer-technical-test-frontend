import { TASK_VIEWS } from '../../../common/constants/tasks.js'
import { getTasks } from '../../../common/services/task/task-service.js'
import {
  consumeNotice,
  getApiErrorCode,
  toViewModel
} from '../helpers/task-view.js'
import { buildListingRequestContext } from '../helpers/listing.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { translate } from '../../../common/locales/translate.js'

class ListController {
  async get(request, h) {
    const notice = consumeNotice(request)
    const { filters, searchError } = buildListingRequestContext(request)
    const baseUrl = ROUTES.TASKS.LIST

    const result = await getTasks({
      search: searchError ? undefined : filters.search
    })

    if (!result.success) {
      const code =
        result.status >= statusCodes.internalServerError
          ? result.status
          : statusCodes.internalServerError

      return h
        .view(TASK_VIEWS.LIST, {
          tasks: [],
          notice,
          filters,
          baseUrl,
          errorList: [
            {
              text: translate(`tasks.errors.${getApiErrorCode(result)}`)
            }
          ]
        })
        .code(code)
    }

    const searchErrorText = searchError
      ? translate(`tasks.errors.${searchError}`)
      : undefined

    return h.view(TASK_VIEWS.LIST, {
      tasks: result.data.map(toViewModel),
      notice,
      filters,
      baseUrl,
      searchError: searchErrorText && { text: searchErrorText },
      errorList: searchErrorText
        ? [{ text: searchErrorText, href: '#search' }]
        : []
    })
  }
}

const controller = new ListController()

export const listController = {
  getHandler: (request, h) => controller.get(request, h)
}
