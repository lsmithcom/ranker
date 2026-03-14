/**
 * In-memory rate limiting middleware.
 * Runs second (01. prefix), before auth.ts.
 *
 * Rules:
 *   POST /api/auth/login          → 10 attempts per 15 min per IP
 *   POST /api/auth/register       → 5 attempts per 60 min per IP
 *   POST /api/auth/forgot-password → 5 attempts per 60 min per IP
 *   POST /api/pull/*              → 20 attempts per 5 min per IP
 *
 * Note: this store is per-process. For multi-instance deployments,
 * replace the Map with a shared store (Redis, etc.).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Prune expired entries every 10 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 10 * 60 * 1000)

function getClientIp(event: Parameters<typeof defineEventHandler>[0] extends (e: infer E) => unknown ? E : never): string {
  return (
    getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    getRequestHeader(event, 'x-real-ip') ||
    event.node.req.socket?.remoteAddress ||
    'unknown'
  )
}

function check(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

const RULES: { path: string; method: string; limit: number; windowMs: number }[] = [
  { path: '/api/auth/login',           method: 'POST', limit: 10, windowMs: 15 * 60 * 1000 },
  { path: '/api/auth/register',        method: 'POST', limit: 5,  windowMs: 60 * 60 * 1000 },
  { path: '/api/auth/forgot-password', method: 'POST', limit: 5,  windowMs: 60 * 60 * 1000 },
  { path: '/api/pull/',                method: 'POST', limit: 20, windowMs:  5 * 60 * 1000 },
]

export default defineEventHandler((event) => {
  const path = event.node.req.url?.split('?')[0] ?? ''
  const method = event.node.req.method ?? ''

  const rule = RULES.find(
    (r) => method === r.method && path.startsWith(r.path),
  )

  if (!rule) return // path not rate-limited

  const ip = getClientIp(event)
  const key = `${rule.path}:${ip}`

  if (!check(key, rule.limit, rule.windowMs)) {
    const windowMinutes = Math.round(rule.windowMs / 60_000)
    throw createError({
      statusCode: 429,
      message: `Too many requests. Please try again in ${windowMinutes} minute${windowMinutes !== 1 ? 's' : ''}.`,
    })
  }
})
