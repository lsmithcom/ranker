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

  // Promote direct children one level up (re-parent to this group's parent)
  await KeywordGroup.updateMany({ userId: user.id, parentId: id }, { $set: { parentId: group.parentId ?? null } })

  // Move keywords/terms in deleted group to its parent (or ungroup if root)
  if (group.type === 'tracked') {
    await TrackedKeyword.updateMany({ userId: user.id, groupId: id }, { $set: { groupId: group.parentId ?? null } })
  } else {
    await BulkKeywordMeta.updateMany({ userId: user.id, groupId: id }, { $set: { groupId: group.parentId ?? null } })
  }

  await group.deleteOne()

  return { success: true }
})
