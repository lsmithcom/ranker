import KeywordGroup from '../../models/KeywordGroup.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { name, parentId } = body

  if (!name) {
    throw createError({ statusCode: 400, message: 'name is required' })
  }

  const update: Record<string, unknown> = { name: name.trim() }
  if (parentId !== undefined) {
    update.parentId = parentId || null
  }

  const group = await KeywordGroup.findOneAndUpdate(
    { _id: id, userId: user.id },
    { $set: update },
    { new: true }
  )

  if (!group) {
    throw createError({ statusCode: 404, message: 'Group not found' })
  }

  return { success: true, data: group }
})
