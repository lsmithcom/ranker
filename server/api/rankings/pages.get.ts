import KeywordRanking from '../../models/KeywordRanking.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  const { keyword, propertyId, source } = query

  if (!keyword || !propertyId) {
    throw createError({ statusCode: 400, message: 'keyword and propertyId are required' })
  }

  const filter: Record<string, unknown> = {
    userId: user.id,
    propertyId,
    keyword,
    page: { $exists: true, $nin: [null, ''] },
  }

  if (source) filter.source = source

  const pages = await KeywordRanking.distinct('page', filter)

  return { success: true, data: pages.filter(Boolean) }
})
