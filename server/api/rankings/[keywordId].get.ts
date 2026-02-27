import KeywordRanking from '../../models/KeywordRanking.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const keywordId = getRouterParam(event, 'keywordId')
  const query = getQuery(event)

  const limit = Math.min(parseInt(query.limit as string) || 90, 365)

  // userId filter ensures data segregation between users
  const rankings = await KeywordRanking.find({
    userId: user.id,
    trackedKeywordId: keywordId,
  })
    .sort({ date: -1 })
    .limit(limit)

  return { success: true, data: rankings, count: rankings.length }
})
