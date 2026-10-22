import { config } from '../../config.js'
import { translate } from '../../../server/common/locales/translate.js'

export function context(request) {
  return {
    assetPath: config.get('assetPath'),
    serviceName: config.get('serviceName'),
    serviceUrl: '/',
    request,
    crumb: request.plugins?.crumb ?? '',
    t: (key) => translate(key)
  }
}
