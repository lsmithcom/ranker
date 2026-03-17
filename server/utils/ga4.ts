import { google } from 'googleapis'
import { decrypt } from './encryption'
import Property from '../models/Property.js'
import Ga4PageMetric from '../models/Ga4PageMetric.js'
import Ga4TrafficSource from '../models/Ga4TrafficSource.js'
import Ga4DeviceMetric from '../models/Ga4DeviceMetric.js'
import Ga4GeoMetric from '../models/Ga4GeoMetric.js'

/**
 * Creates an authenticated GA4 Data API client for a user.
 * Reuses the same Google OAuth tokens as GSC (tokens must have analytics.readonly scope).
 */
export async function getGa4Client(userId: string) {
  const config = useRuntimeConfig()

  const oauth2Client = new google.auth.OAuth2(
    config.googleClientId as string,
    config.googleClientSecret as string,
    config.googleRedirectUri as string,
  )

  const User = (await import('../models/User.js')).default
  const user = await User.findById(userId).select('+gscAccessToken +gscRefreshToken +gscTokenExpiry')
  if (!user?.gscAccessToken) {
    throw createError({
      statusCode: 401,
      message: 'Google account not connected. Please authorize via /api/auth/google.',
    })
  }

  oauth2Client.setCredentials({
    access_token: decrypt(user.gscAccessToken),
    refresh_token: user.gscRefreshToken ? decrypt(user.gscRefreshToken) : undefined,
    expiry_date: user.gscTokenExpiry ? user.gscTokenExpiry.getTime() : undefined,
  })

  // Persist refreshed tokens back to DB
  oauth2Client.on('tokens', async (tokens) => {
    const { encrypt } = await import('./encryption')
    const updates: Record<string, unknown> = {}
    if (tokens.access_token) updates.gscAccessToken = encrypt(tokens.access_token)
    if (tokens.refresh_token) updates.gscRefreshToken = encrypt(tokens.refresh_token)
    if (tokens.expiry_date) updates.gscTokenExpiry = new Date(tokens.expiry_date)
    if (Object.keys(updates).length > 0) {
      await User.updateOne({ _id: userId }, updates)
    }
  })

  const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client })
  return { oauth2Client, analyticsData }
}

/**
 * Pulls all GA4 aggregated metrics for a single day (default: yesterday) and upserts
 * them into the 4 GA4 collections. Idempotent — safe to run multiple times per day.
 */
export async function pullGa4Data(userId: string, propertyId: string, targetDate?: Date) {
  const property = await (Property as any).findOne({ _id: propertyId, userId })
  if (!property) throw new Error('Property not found')
  if (!property.ga4PropertyId) throw new Error('GA4 Property ID not configured for this property. Set it in Settings.')

  const { analyticsData } = await getGa4Client(userId)

  // Default to yesterday — GA4 data takes ~24h to finalize
  const date = targetDate ?? (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d
  })()
  date.setHours(0, 0, 0, 0)

  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
  const ga4PropertyPath = `properties/${property.ga4PropertyId}`
  const dateRanges = [{ startDate: dateStr, endDate: dateStr }]

  const baseFields = {
    userId,
    propertyId,
    ga4PropertyId: property.ga4PropertyId,
    date,
  }

  // ── Page Metrics (paginated — large sites can have thousands of pages) ─────
  const pageRowLimit = 10000
  let pageOffset = 0
  let hasMorePages = true

  while (hasMorePages) {
    const res = await analyticsData.properties.runReport({
      property: ga4PropertyPath,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'engagementRate' },
          { name: 'scrolledUsers' },
          { name: 'conversions' },
        ],
        limit: pageRowLimit,
        offset: pageOffset,
      },
    })

    const rows = res.data.rows || []

    for (const row of rows) {
      const d = row.dimensionValues || []
      const m = row.metricValues || []

      await (Ga4PageMetric as any).findOneAndUpdate(
        { ...baseFields, pagePath: d[0]?.value || '/' },
        {
          $set: {
            pageTitle: d[1]?.value || '',
            screenPageViews: parseInt(m[0]?.value || '0'),
            sessions: parseInt(m[1]?.value || '0'),
            users: parseInt(m[2]?.value || '0'),
            newUsers: parseInt(m[3]?.value || '0'),
            bounceRate: parseFloat(m[4]?.value || '0'),
            avgSessionDurationSec: parseFloat(m[5]?.value || '0'),
            engagementRate: parseFloat(m[6]?.value || '0'),
            scrolledUsers: parseInt(m[7]?.value || '0'),
            conversions: parseInt(m[8]?.value || '0'),
            pulledAt: new Date(),
          },
        },
        { upsert: true },
      )
    }

    if (rows.length < pageRowLimit) {
      hasMorePages = false
    } else {
      pageOffset += pageRowLimit
    }
  }

  // ── Traffic Sources ────────────────────────────────────────────────────────
  const sourceRes = await analyticsData.properties.runReport({
    property: ga4PropertyPath,
    requestBody: {
      dateRanges,
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' },
        { name: 'sessionDefaultChannelGroup' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'bounceRate' },
        { name: 'engagementRate' },
        { name: 'conversions' },
      ],
      limit: 5000,
    },
  })

  for (const row of sourceRes.data.rows || []) {
    const d = row.dimensionValues || []
    const m = row.metricValues || []

    await (Ga4TrafficSource as any).findOneAndUpdate(
      {
        ...baseFields,
        sessionSource: d[0]?.value || '(none)',
        sessionMedium: d[1]?.value || '(none)',
        sessionCampaignName: d[2]?.value || '(none)',
      },
      {
        $set: {
          sessionDefaultChannelGroup: d[3]?.value || '(Other)',
          sessions: parseInt(m[0]?.value || '0'),
          users: parseInt(m[1]?.value || '0'),
          newUsers: parseInt(m[2]?.value || '0'),
          bounceRate: parseFloat(m[3]?.value || '0'),
          engagementRate: parseFloat(m[4]?.value || '0'),
          conversions: parseInt(m[5]?.value || '0'),
          pulledAt: new Date(),
        },
      },
      { upsert: true },
    )
  }

  // ── Device Metrics ─────────────────────────────────────────────────────────
  const deviceRes = await analyticsData.properties.runReport({
    property: ga4PropertyPath,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
      ],
      limit: 100,
    },
  })

  for (const row of deviceRes.data.rows || []) {
    const d = row.dimensionValues || []
    const m = row.metricValues || []

    await (Ga4DeviceMetric as any).findOneAndUpdate(
      { ...baseFields, deviceCategory: d[0]?.value || 'unknown' },
      {
        $set: {
          sessions: parseInt(m[0]?.value || '0'),
          users: parseInt(m[1]?.value || '0'),
          screenPageViews: parseInt(m[2]?.value || '0'),
          pulledAt: new Date(),
        },
      },
      { upsert: true },
    )
  }

  // ── Geo Metrics ────────────────────────────────────────────────────────────
  const geoRes = await analyticsData.properties.runReport({
    property: ga4PropertyPath,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'country' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
      ],
      limit: 500,
    },
  })

  for (const row of geoRes.data.rows || []) {
    const d = row.dimensionValues || []
    const m = row.metricValues || []

    await (Ga4GeoMetric as any).findOneAndUpdate(
      { ...baseFields, country: d[0]?.value || '(not set)' },
      {
        $set: {
          sessions: parseInt(m[0]?.value || '0'),
          users: parseInt(m[1]?.value || '0'),
          pulledAt: new Date(),
        },
      },
      { upsert: true },
    )
  }

  // Mark last GA4 pull time on the property
  await (Property as any).updateOne(
    { _id: propertyId },
    { $set: { ga4LastPulledAt: new Date() } },
  )
}
