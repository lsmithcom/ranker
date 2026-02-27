import KeywordRanking from '../../models/KeywordRanking.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  if (!query.keyword) {
    throw createError({ statusCode: 400, message: 'keyword query parameter is required' })
  }

  const limit = Math.min(parseInt(query.limit as string) || 90, 365)

  const filter: Record<string, unknown> = {
    userId: user.id,
    keyword: (query.keyword as string).toLowerCase().trim(),
  }

  if (query.propertyId) filter.propertyId = query.propertyId
  if (query.source) filter.source = query.source

  const rankings = await KeywordRanking.find(filter)
    .sort({ date: -1 })
    .limit(limit)

  return { success: true, data: rankings, count: rankings.length }
})
