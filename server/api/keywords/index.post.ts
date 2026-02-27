import TrackedKeyword from '../../models/TrackedKeyword.js'
import Property from '../../models/Property.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { propertyId, keyword, targetPage, tags, priority, notes, groupId } = body

  if (!propertyId || !keyword) {
    throw createError({ statusCode: 400, message: 'propertyId and keyword are required' })
  }

  // Verify the property belongs to this user
  const property = await Property.findOne({ _id: propertyId, userId: user.id })
  if (!property) {
    throw createError({ statusCode: 404, message: 'Property not found' })
  }

  const normalizedKeyword = keyword.toLowerCase().trim()

  // Prevent duplicate keyword tracking per property
  const existing = await TrackedKeyword.findOne({
    userId: user.id,
    propertyId,
    keyword: normalizedKeyword,
  })
  if (existing) {
    throw createError({ statusCode: 409, message: 'This keyword is already being tracked for this property' })
  }

  const trackedKeyword = await TrackedKeyword.create({
    userId: user.id,
    propertyId,
    keyword: normalizedKeyword,
    groupId: groupId || null,
    targetPage: targetPage?.trim() || undefined,
    tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()) : [],
    priority: priority || 'medium',
    notes: notes || undefined,
    createdAt: new Date(),
  })

  return { success: true, data: trackedKeyword }
})
