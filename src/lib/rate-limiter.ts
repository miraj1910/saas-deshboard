import { logger } from '@/lib/logger'

type RateLimitConfig = {
  windowMs: number
  maxRequests: number
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

const stores = new Map<string, RateLimitEntry>()

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  api: { windowMs: 60 * 1000, maxRequests: 60 },
}

function getConfig(pathname: string): RateLimitConfig {
  if (pathname.startsWith('/api/auth')) return RATE_LIMITS.auth
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/register')) {
    return RATE_LIMITS.auth
  }
  return RATE_LIMITS.api
}

function getKey(ip: string, pathname: string): string {
  const config = getConfig(pathname)
  const windowKey = Math.floor(Date.now() / config.windowMs)
  return `${ip}:${pathname}:${windowKey}`
}

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of stores) {
    if (entry.resetAt <= now) {
      stores.delete(key)
    }
  }
}

export function checkRateLimit(ip: string, pathname: string): {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
} {
  const config = getConfig(pathname)
  const key = getKey(ip, pathname)
  const now = Date.now()

  const entry = stores.get(key)

  if (!entry || entry.resetAt <= now) {
    stores.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs, limit: config.maxRequests }
  }

  entry.count++

  if (entry.count > config.maxRequests) {
    logger.warn('rate limit exceeded', { ip: ip?.slice(0, 10), path: pathname, count: entry.count })
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, limit: config.maxRequests }
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt, limit: config.maxRequests }
}
