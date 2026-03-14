import BulkKeywordMeta from '../../models/BulkKeywordMeta.js'
import { verifyPropertyOwnership } from '../../utils/verify-property.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  await verifyPropertyOwnership(String(query.propertyId || ''), user.id)

  const metas = await BulkKeywordMeta.find({ userId: user.id, propertyId: query.propertyId })

  // Return as a keyword → groupId map
  const map: Record<string, string | null> = {}
  for (const meta of metas) {
    map[meta.keyword] = meta.groupId ? String(meta.groupId) : null
  }

  return { success: true, data: map }
})
