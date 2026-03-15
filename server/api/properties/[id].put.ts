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

    // Compute initial nextPullAt from startDate and pullHour, always resolving
    // to the next future occurrence so stale start dates don't get saved as past.
    if (startDate) {
      sched.startDate = new Date(startDate)
      const next = new Date(startDate)
      const hour = sched.pullHour ?? 12
      next.setHours(hour, 0, 0, 0)

      const now = new Date()
      const freq: string = sched.frequency || 'daily'
      while (next <= now) {
        if (freq === 'daily') {
          next.setDate(next.getDate() + 1)
        } else if (freq === 'weekly') {
          next.setDate(next.getDate() + 7)
        } else if (freq === 'monthly') {
          next.setMonth(next.getMonth() + 1)
        } else {
          break
        }
        next.setHours(hour, 0, 0, 0)
      }

      sched.nextPullAt = next
    }

    updates.pullSchedule = sched
  }

  if (body.propertyName) updates.propertyName = body.propertyName
  if (body.isActive !== undefined) updates.isActive = body.isActive
  if (body.ga4PropertyId !== undefined) updates.ga4PropertyId = body.ga4PropertyId || null

  updates.updatedAt = new Date()

  const updated = await Property.findOneAndUpdate(
    { _id: id, userId: user.id },
    { $set: updates },
    { new: true }
  )

  return { success: true, data: updated }
})
