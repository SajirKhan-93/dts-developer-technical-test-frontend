import { statusCodes } from '../constants/status-codes.js'
import { translate } from '../locales/translate.js'

function statusCodeMessage(statusCode) {
  switch (statusCode) {
    case statusCodes.notFound:
      return translate('common.page_not_found')
    case statusCodes.forbidden:
      return translate('common.forbidden')
    case statusCodes.badRequest:
      return translate('common.bad_request')
    default:
      return translate('common.something_went_wrong')
  }
}

export function catchAll(request, h) {
  const { response } = request

  if (!('isBoom' in response)) {
    return h.continue
  }

  const statusCode = response.output.statusCode
  const errorMessage = statusCodeMessage(statusCode)

  if (statusCode >= statusCodes.internalServerError) {
    request.logger.error(response?.stack)
  }

  return h
    .view('error/index', {
      pageTitle: errorMessage,
      heading: statusCode,
      message: errorMessage
    })
    .code(statusCode)
}
