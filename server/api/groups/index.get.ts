import KeywordGroup from '../../models/KeywordGroup.js'
import { verifyPropertyOwnership } from '../../utils/verify-property.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  await verifyPropertyOwnership(String(query.propertyId || ''), user.id)

  const filter: Record<string, unknown> = { userId: user.id, propertyId: query.propertyId }
  if (query.type) filter.type = query.type

  const groups = await KeywordGroup.find(filter).sort({ name: 1 })

  return { success: true, data: groups }
})
