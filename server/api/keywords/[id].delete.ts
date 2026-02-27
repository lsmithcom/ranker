import TrackedKeyword from '../../models/TrackedKeyword.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = getRouterParam(event, 'id')

  // userId filter ensures users can only delete their own keywords
  const keyword = await TrackedKeyword.findOneAndDelete({
    _id: id,
    userId: user.id,
  })

  if (!keyword) {
    throw createError({ statusCode: 404, message: 'Keyword not found' })
  }

  return { success: true }
})
