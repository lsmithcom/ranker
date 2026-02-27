import KeywordGroup from '../../models/KeywordGroup.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  if (!query.propertyId) {
    throw createError({ statusCode: 400, message: 'propertyId is required' })
  }

  const filter: Record<string, unknown> = { userId: user.id, propertyId: query.propertyId }
  if (query.type) filter.type = query.type

  const groups = await KeywordGroup.find(filter).sort({ name: 1 })

  return { success: true, data: groups }
})
