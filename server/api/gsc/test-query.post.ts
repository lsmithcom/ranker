import { getGscClient } from '../../utils/gsc'

// Realistic mock data for testing without OAuth
function getMockQueryData(keyword: string, siteUrl: string) {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 28)

  return {
    rows: [
      {
        keys: [keyword, `${siteUrl}/`],
        clicks: 42,
        impressions: 1280,
        ctr: 0.0328,
        position: 8.3,
      },
      {
        keys: [keyword, `${siteUrl}/blog/related-post`],
        clicks: 15,
        impressions: 890,
        ctr: 0.0169,
        position: 14.7,
      },
    ],
    responseAggregationType: 'byPage',
    _mock: true,
    _note: 'This is mock data. Connect Google Search Console to see real data.',
  }
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)

  const { keyword, siteUrl, startDate, endDate, useMock } = body

  if (!keyword) {
    throw createError({ statusCode: 400, message: 'keyword is required' })
  }

  if (!siteUrl) {
    throw createError({ statusCode: 400, message: 'siteUrl is required (e.g. sc-domain:example.com or https://example.com/)' })
  }

  // Use mock data if explicitly requested or if GSC is not configured
  if (useMock) {
    const mockData = getMockQueryData(keyword, siteUrl)
    return {
      success: true,
      raw: mockData,
      processed: (mockData.rows || []).map((row: Record<string, unknown>) => {
        const keys = row.keys as string[]
        return {
          keyword: keys[0],
          page: keys[1],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: typeof row.ctr === 'number' ? `${(row.ctr * 100).toFixed(2)}%` : null,
          position: typeof row.position === 'number' ? Math.round((row.position as number) * 10) / 10 : null,
        }
      }),
      meta: {
        keyword,
        siteUrl,
        dateRange: { startDate, endDate },
        isMock: true,
      },
    }
  }

  // Attempt real GSC query
  try {
    const { searchConsole } = await getGscClient(user.id)

    const end = endDate || new Date().toISOString().split('T')[0]
    const start = startDate || (() => {
      const d = new Date()
      d.setDate(d.getDate() - 28)
      return d.toISOString().split('T')[0]
    })()

    const response = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ['query', 'page'],
        rowLimit: 25000,
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'query',
            operator: 'equals',
            expression: keyword,
          }],
        }],
      },
    })

    const rows = response.data.rows || []

    return {
      success: true,
      raw: response.data,
      processed: rows.map((row) => {
        const keys = row.keys || []
        return {
          keyword: keys[0],
          page: keys[1],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: typeof row.ctr === 'number' ? `${(row.ctr * 100).toFixed(2)}%` : null,
          position: typeof row.position === 'number' ? Math.round(row.position * 10) / 10 : null,
        }
      }),
      meta: {
        keyword,
        siteUrl,
        dateRange: { startDate: start, endDate: end },
        rowCount: rows.length,
        isMock: false,
      },
    }
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string }
    // If not connected, return informative error
    if (error?.statusCode === 401) {
      throw createError({
        statusCode: 401,
        message: 'Google Search Console not connected. Use useMock: true to test with sample data, or connect GSC at /api/auth/google',
      })
    }
    throw createError({
      statusCode: 500,
      message: `GSC query failed: ${error?.message || 'Unknown error'}`,
    })
  }
})
