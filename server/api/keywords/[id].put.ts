import TrackedKeyword from '../../models/TrackedKeyword.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const allowedFields = ['groupId', 'targetPage', 'priority', 'notes', 'tags', 'isActive']
  const updates: Record<string, unknown> = {}

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No valid fields provided to update' })
  }

  // Allow explicitly setting groupId to null
  if ('groupId' in body && body.groupId === null) {
    updates.groupId = null
  }

  const keyword = await TrackedKeyword.findOneAndUpdate(
    { _id: id, userId: user.id },
    { $set: updates },
    { new: true }
  )

  if (!keyword) {
    throw createError({ statusCode: 404, message: 'Keyword not found' })
  }

  return { success: true, data: keyword }
})
