import { pullBulkKeywords } from '../../utils/pull'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { propertyId } = body

  if (!propertyId) {
    throw createError({ statusCode: 400, message: 'propertyId is required' })
  }

  await pullBulkKeywords(String(user.id), String(propertyId))

  return { success: true, message: 'Bulk pull completed' }
})
