import { getGscClient } from '../../utils/gsc'

// Realistic mock bulk data for testing without OAuth
function getMockBulkData(siteUrl: string) {
  const mockTerms = [
    { query: 'best running shoes 2024', clicks: 234, impressions: 8920, ctr: 0.0262, position: 4.2 },
    { query: 'how to choose running shoes', clicks: 187, impressions: 6430, ctr: 0.0291, position: 6.8 },
    { query: 'running shoes for flat feet', clicks: 156, impressions: 5210, ctr: 0.0299, position: 3.1 },
    { query: 'nike vs adidas running shoes', clicks: 134, impressions: 7890, ctr: 0.0170, position: 11.4 },
    { query: 'running shoes review', clicks: 98, impressions: 4560, ctr: 0.0215, position: 8.9 },
    { query: 'marathon training shoes', clicks: 87, impressions: 3240, ctr: 0.0269, position: 5.6 },
    { query: 'lightweight running shoes', clicks: 76, impressions: 2890, ctr: 0.0263, position: 7.3 },
    { query: 'cushioned running shoes', clicks: 65, impressions: 2340, ctr: 0.0278, position: 9.1 },
    { query: 'trail running shoes', clicks: 54, impressions: 1980, ctr: 0.0273, position: 12.6 },
    { query: 'running shoes sale', clicks: 43, impressions: 3450, ctr: 0.0125, position: 18.3 },
  ]

  return {
    rows: mockTerms.map(t => ({
      keys: [t.query, `${siteUrl}/`],
      clicks: t.clicks,
      impressions: t.impressions,
      ctr: t.ctr,
      position: t.position,
    })),
    responseAggregationType: 'byProperty',
    _mock: true,
    _note: 'This is mock data. Connect Google Search Console to see real data.',
  }
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  const siteUrl = query.siteUrl as string
  const useMock = query.mock === 'true'
  const page = parseInt(query.page as string) || 1
  const pageSize = Math.min(parseInt(query.pageSize as string) || 100, 1000)

  if (!siteUrl && !useMock) {
    throw createError({
      statusCode: 400,
      message: 'siteUrl is required. Add ?siteUrl=sc-domain:example.com or ?mock=true for test data.',
    })
  }

  const end = (query.endDate as string) || new Date().toISOString().split('T')[0]
  const start = (query.startDate as string) || (() => {
    const d = new Date()
    d.setDate(d.getDate() - 28)
    return d.toISOString().split('T')[0]
  })()

  if (useMock) {
    const mockData = getMockBulkData(siteUrl || 'https://example.com')
    const allRows = mockData.rows || []
    const startIdx = (page - 1) * pageSize
    const pagedRows = allRows.slice(startIdx, startIdx + pageSize)

    return {
      success: true,
      raw: { ...mockData, rows: pagedRows },
      processed: pagedRows.map((row: Record<string, unknown>) => {
        const keys = row.keys as string[]
        return {
          keyword: keys[0],
          page: keys[1],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: typeof row.ctr === 'number' ? `${((row.ctr as number) * 100).toFixed(2)}%` : null,
          position: typeof row.position === 'number' ? Math.round((row.position as number) * 10) / 10 : null,
        }
      }),
      pagination: {
        page,
        pageSize,
        total: allRows.length,
        totalPages: Math.ceil(allRows.length / pageSize),
      },
      meta: {
        siteUrl: siteUrl || 'https://example.com',
        dateRange: { startDate: start, endDate: end },
        isMock: true,
      },
    }
  }

  // Real GSC bulk pull
  try {
    const { searchConsole } = await getGscClient(user.id)

    // GSC API max rowLimit is 25000; for pagination we use startRow
    const startRow = (page - 1) * pageSize

    const response = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ['query', 'page'],
        rowLimit: pageSize,
        startRow,
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
      pagination: {
        page,
        pageSize,
        rowsFetched: rows.length,
        hasMore: rows.length === pageSize,
      },
      meta: {
        siteUrl,
        dateRange: { startDate: start, endDate: end },
        isMock: false,
      },
    }
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string }
    if (error?.statusCode === 401) {
      throw createError({
        statusCode: 401,
        message: 'Google Search Console not connected. Add ?mock=true to test with sample data.',
      })
    }
    throw createError({
      statusCode: 500,
      message: `GSC bulk pull failed: ${error?.message || 'Unknown error'}`,
    })
  }
})
