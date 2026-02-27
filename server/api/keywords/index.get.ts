import TrackedKeyword from '../../models/TrackedKeyword.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  const filter: Record<string, unknown> = { userId: user.id }

  if (query.propertyId) filter.propertyId = query.propertyId
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true'
  if (query.priority) filter.priority = query.priority

  const keywords = await TrackedKeyword.find(filter)
    .sort({ priority: 1, latestPosition: 1, createdAt: -1 })

  return { success: true, data: keywords }
})
