export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Only process API routes
  if (!path.startsWith('/api/')) {
    return
  }

  // Routes that do not require authentication
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/google',
  ]

  if (publicPaths.some(p => path.startsWith(p))) {
    return
  }

  // Verify session
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    })
  }

  // Attach user to event context so route handlers can access it
  event.context.user = session.user
})
