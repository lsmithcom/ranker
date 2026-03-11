import { pullBulkKeywords } from '../../utils/pull'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { propertyId } = body

  if (!propertyId) {
    throw createError({ statusCode: 400, message: 'propertyId is required' })
  }

  try {
    await pullBulkKeywords(String(user.id), String(propertyId))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    throw createError({ statusCode: 500, message: `Pull failed: ${msg}` })
  }

  return { success: true, message: 'Bulk pull completed' }
})
