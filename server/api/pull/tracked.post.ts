import { pullTrackedKeywords } from '../../utils/pull'
import TrackedKeyword from '../../models/TrackedKeyword.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { propertyId } = body

  if (!propertyId) {
    throw createError({ statusCode: 400, message: 'propertyId is required' })
  }

  await pullTrackedKeywords(String(user.id), String(propertyId))

  // Return updated keywords
  const keywords = await TrackedKeyword.find({ userId: user.id, propertyId, isActive: true })

  return { success: true, data: keywords }
})
