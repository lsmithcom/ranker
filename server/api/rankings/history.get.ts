import KeywordRanking from '../../models/KeywordRanking.js'
import { verifyPropertyOwnership } from '../../utils/verify-property.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  const { keyword, propertyId, source, range } = query

  if (!keyword || !propertyId) {
    throw createError({ statusCode: 400, message: 'keyword and propertyId are required' })
  }

  await verifyPropertyOwnership(String(propertyId), user.id)

  // Compute date range cutoff
  const now = new Date()
  const cutoff = new Date()
  if (range === '1y') {
    cutoff.setFullYear(now.getFullYear() - 1)
  } else if (range === '2y') {
    cutoff.setFullYear(now.getFullYear() - 2)
  } else {
    // default 6m
    cutoff.setMonth(now.getMonth() - 6)
  }

  const filter: Record<string, unknown> = {
    userId: user.id,
    propertyId,
    keyword,
    date: { $gte: cutoff },
  }

  if (source) filter.source = source

  const records = await KeywordRanking.find(filter)
    .select('date position page')
    .sort({ date: 1 })

  return {
    success: true,
    data: records.map((r) => ({
      date: r.date,
      position: r.position,
      page: r.page,
    })),
  }
})
