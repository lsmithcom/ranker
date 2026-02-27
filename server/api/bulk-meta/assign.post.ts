import BulkKeywordMeta from '../../models/BulkKeywordMeta.js'
import Property from '../../models/Property.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { keyword, propertyId, groupId } = body

  if (!keyword || !propertyId) {
    throw createError({ statusCode: 400, message: 'keyword and propertyId are required' })
  }

  const property = await Property.findOne({ _id: propertyId, userId: user.id })
  if (!property) {
    throw createError({ statusCode: 404, message: 'Property not found' })
  }

  const meta = await BulkKeywordMeta.findOneAndUpdate(
    { userId: user.id, propertyId, keyword },
    { $set: { groupId: groupId || null } },
    { upsert: true, new: true }
  )

  return { success: true, data: meta }
})
