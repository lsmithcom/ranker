import TrackedKeyword from '../../models/TrackedKeyword.js'
import KeywordRanking from '../../models/KeywordRanking.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { ids } = body

  if (!Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: 'ids array is required' })
  }

  // Delete associated ranking records first
  await KeywordRanking.deleteMany({ userId: user.id, trackedKeywordId: { $in: ids } })

  // Delete the tracked keywords
  const result = await TrackedKeyword.deleteMany({ _id: { $in: ids }, userId: user.id })

  return { success: true, deleted: result.deletedCount }
})
