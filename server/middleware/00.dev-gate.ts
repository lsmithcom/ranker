export default defineEventHandler((event) => {
  const passcode = useRuntimeConfig().devPasscode
  if (!passcode) return // disabled in production

  const path = getRequestURL(event).pathname
  if (path === '/dev-gate' || path === '/api/dev-gate') return

  const cookie = getCookie(event, 'dev_access')
  if (cookie === passcode) return

  if (path.startsWith('/api/')) {
    throw createError({ statusCode: 403, message: 'Dev access required' })
  }

  return sendRedirect(event, '/dev-gate')
})
