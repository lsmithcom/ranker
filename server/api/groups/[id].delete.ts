import KeywordGroup from '../../models/KeywordGroup.js'
import TrackedKeyword from '../../models/TrackedKeyword.js'
import BulkKeywordMeta from '../../models/BulkKeywordMeta.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = getRouterParam(event, 'id')

  const group = await KeywordGroup.findOne({ _id: id, userId: user.id })
  if (!group) {
    throw createError({ statusCode: 404, message: 'Group not found' })
  }

  // Clear group assignments for tracked keywords
  if (group.type === 'tracked') {
    await TrackedKeyword.updateMany({ userId: user.id, groupId: id }, { $set: { groupId: null } })
  } else {
    await BulkKeywordMeta.updateMany({ userId: user.id, groupId: id }, { $set: { groupId: null } })
  }

  await group.deleteOne()

  return { success: true }
})
