import Property from '../../models/Property.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const property = await Property.findOne({ _id: id, userId: user.id })
  if (!property) {
    throw createError({ statusCode: 404, message: 'Property not found' })
  }

  const updates: Record<string, unknown> = {}

  // Update pullSchedule if provided
  if (body.pullSchedule) {
    const { frequency, startDate, pullHour, isScheduled } = body.pullSchedule

    const sched = property.pullSchedule || {}

    if (frequency) sched.frequency = frequency
    if (pullHour !== undefined) sched.pullHour = pullHour
    if (isScheduled !== undefined) sched.isScheduled = isScheduled

    // Compute initial nextPullAt from startDate and pullHour
    if (startDate) {
      sched.startDate = new Date(startDate)
      const next = new Date(startDate)
      next.setHours(sched.pullHour ?? 12, 0, 0, 0)
      sched.nextPullAt = next
    }

    updates.pullSchedule = sched
  }

  if (body.propertyName) updates.propertyName = body.propertyName
  if (body.isActive !== undefined) updates.isActive = body.isActive

  updates.updatedAt = new Date()

  const updated = await Property.findOneAndUpdate(
    { _id: id, userId: user.id },
    { $set: updates },
    { new: true }
  )

  return { success: true, data: updated }
})
