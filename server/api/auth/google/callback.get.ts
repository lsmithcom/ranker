import { exchangeCodeForTokens } from '../../../utils/gsc'
import { encrypt } from '../../../utils/encryption'
import User from '../../../models/User.js'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    return sendRedirect(event, '/login?error=session_expired')
  }

  const query = getQuery(event)
  const code = query.code as string
  const error = query.error as string

  if (error) {
    console.error('[GSC OAuth] Error from Google:', error)
    return sendRedirect(event, '/dashboard?gsc=error&reason=' + encodeURIComponent(error))
  }

  if (!code) {
    return sendRedirect(event, '/dashboard?gsc=error&reason=no_code')
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    const updates: Record<string, unknown> = {}
    if (tokens.access_token) updates.gscAccessToken = encrypt(tokens.access_token)
    if (tokens.refresh_token) updates.gscRefreshToken = encrypt(tokens.refresh_token)
    if (tokens.expiry_date) updates.gscTokenExpiry = new Date(tokens.expiry_date)

    await User.updateOne({ _id: session.user.id }, updates)

    return sendRedirect(event, '/dashboard?gsc=connected')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[GSC OAuth] Token exchange failed:', message)
    return sendRedirect(event, '/dashboard?gsc=error&reason=' + encodeURIComponent(message))
  }
})
