import KeywordGroup from '../../models/KeywordGroup.js'
import Property from '../../models/Property.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { propertyId, name, type, parentId } = body

  if (!propertyId || !name || !type) {
    throw createError({ statusCode: 400, message: 'propertyId, name, and type are required' })
  }

  if (!['tracked', 'bulk'].includes(type)) {
    throw createError({ statusCode: 400, message: 'type must be "tracked" or "bulk"' })
  }

  const property = await Property.findOne({ _id: propertyId, userId: user.id })
  if (!property) {
    throw createError({ statusCode: 404, message: 'Property not found' })
  }

  const existing = await KeywordGroup.findOne({
    userId: user.id,
    propertyId,
    parentId: parentId || null,
    name: name.trim(),
    type,
  })
  if (existing) {
    throw createError({ statusCode: 409, message: 'A group with this name already exists in this location' })
  }

  const group = await KeywordGroup.create({
    userId: user.id,
    propertyId,
    name: name.trim(),
    type,
    parentId: parentId || null,
  })

  return { success: true, data: group }
})
