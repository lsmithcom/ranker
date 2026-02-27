import Property from '../../models/Property.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  const properties = await Property.find({ userId: user.id })
    .sort({ createdAt: -1 })

  return { success: true, data: properties }
})
