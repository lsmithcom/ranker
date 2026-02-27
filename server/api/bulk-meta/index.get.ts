import BulkKeywordMeta from '../../models/BulkKeywordMeta.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  if (!query.propertyId) {
    throw createError({ statusCode: 400, message: 'propertyId is required' })
  }

  const metas = await BulkKeywordMeta.find({ userId: user.id, propertyId: query.propertyId })

  // Return as a keyword → groupId map
  const map: Record<string, string | null> = {}
  for (const meta of metas) {
    map[meta.keyword] = meta.groupId ? String(meta.groupId) : null
  }

  return { success: true, data: map }
})
