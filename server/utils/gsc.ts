import { google } from 'googleapis'
import { decrypt } from './encryption'

/**
 * Creates an authenticated Google Search Console client for a user.
 * Throws if the user has not connected their Google account.
 */
export async function getGscClient(userId: string) {
  const config = useRuntimeConfig()

  const oauth2Client = new google.auth.OAuth2(
    config.googleClientId as string,
    config.googleClientSecret as string,
    config.googleRedirectUri as string,
  )

  // Dynamically import User model to avoid circular dependency issues
  const User = (await import('../models/User.js')).default

  const user = await User.findById(userId).select('+gscAccessToken +gscRefreshToken +gscTokenExpiry')
  if (!user?.gscAccessToken) {
    throw createError({
      statusCode: 401,
      message: 'Google Search Console not connected. Please authorize via /api/auth/google.',
    })
  }

  oauth2Client.setCredentials({
    access_token: decrypt(user.gscAccessToken),
    refresh_token: user.gscRefreshToken ? decrypt(user.gscRefreshToken) : undefined,
    expiry_date: user.gscTokenExpiry ? user.gscTokenExpiry.getTime() : undefined,
  })

  // Automatically save refreshed tokens back to the database
  oauth2Client.on('tokens', async (tokens) => {
    const { encrypt } = await import('./encryption')
    const updates: Record<string, unknown> = {}

    if (tokens.access_token) {
      updates.gscAccessToken = encrypt(tokens.access_token)
    }
    if (tokens.refresh_token) {
      updates.gscRefreshToken = encrypt(tokens.refresh_token)
    }
    if (tokens.expiry_date) {
      updates.gscTokenExpiry = new Date(tokens.expiry_date)
    }
    if (Object.keys(updates).length > 0) {
      await User.updateOne({ _id: userId }, updates)
    }
  })

  const searchConsole = google.webmasters({ version: 'v3', auth: oauth2Client })
  return { oauth2Client, searchConsole }
}

/**
 * Generates the Google OAuth2 authorization URL for GSC access.
 */
export function getGoogleAuthUrl(): string {
  const config = useRuntimeConfig()

  const oauth2Client = new google.auth.OAuth2(
    config.googleClientId as string,
    config.googleClientSecret as string,
    config.googleRedirectUri as string,
  )

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force to always return refresh_token
    scope: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  })
}

/**
 * Exchanges an OAuth code for tokens.
 */
export async function exchangeCodeForTokens(code: string) {
  const config = useRuntimeConfig()

  const oauth2Client = new google.auth.OAuth2(
    config.googleClientId as string,
    config.googleClientSecret as string,
    config.googleRedirectUri as string,
  )

  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}
