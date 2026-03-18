/**
 * IP whitelist middleware.
 * Runs first — blocks all requests from non-whitelisted IPs with a 403.
 *
 * To add/remove IPs, update WHITELISTED_IPS and redeploy.
 *
 * Railway passes the real client IP as the first entry in x-forwarded-for.
 */

const WHITELISTED_IPS: string[] = [
  '47.154.122.153',
]

function getClientIp(event: Parameters<typeof defineEventHandler>[0] extends (e: infer E) => unknown ? E : never): string {
  return (
    getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    getRequestHeader(event, 'x-real-ip') ||
    event.node.req.socket?.remoteAddress ||
    'unknown'
  )
}

export default defineEventHandler((event) => {
  const ip = getClientIp(event)

  if (!WHITELISTED_IPS.includes(ip)) {
    throw createError({
      statusCode: 403,
      message: 'Access Denied',
    })
  }
})
