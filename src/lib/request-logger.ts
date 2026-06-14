import { logger } from '@/lib/logger'

export function logRequest(req: Request, startTime: number, status: number) {
  const url = new URL(req.url)
  const duration = Date.now() - startTime

  logger.info('request completed', {
    method: req.method,
    path: url.pathname,
    status,
    durationMs: duration,
    userAgent: req.headers.get('user-agent')?.slice(0, 100),
    referer: req.headers.get('referer')?.slice(0, 200),
  })
}

export function withRequestLogging(handler: (req: Request) => Promise<Response>) {
  return async function (req: Request) {
    const startTime = Date.now()
    const url = new URL(req.url)

    logger.debug('request started', {
      method: req.method,
      path: url.pathname,
    })

    try {
      const response = await handler(req)
      logRequest(req, startTime, response.status)
      return response
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      const status = 'status' in (e as object) ? ((e as { status: number }).status) : 500
      logRequest(req, startTime, status)
      throw e
    }
  }
}
