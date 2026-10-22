/**
 * Hapi onPreResponse extension that sets Cache-Control: no-store on HTML
 * pages. Static assets under /public and /assets are excluded.
 *
 * Register this extension AFTER catchAll so it applies to error views too.
 */
export function noCacheHeaders(request, h) {
  const { response } = request

  if (
    request.path.startsWith('/public') ||
    request.path.startsWith('/assets') ||
    request.path === '/favicon.ico' ||
    request.path === '/health'
  ) {
    return h.continue
  }

  if (response.isBoom) {
    response.output.headers['Cache-Control'] = 'no-store'
  } else {
    response.header('Cache-Control', 'no-store')
  }

  return h.continue
}
