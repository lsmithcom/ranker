import { pullTrackedKeywords, pullBulkKeywords, updateNextPullAt } from '../utils/pull'

async function runScheduledPulls() {
  const Property = (await import('../models/Property.js')).default

  const now = new Date()
  const properties = await (Property as any).find({
    'pullSchedule.isScheduled': true,
    'pullSchedule.nextPullAt': { $lte: now },
  })

  if (properties.length === 0) return

  console.log(`[scheduler] Found ${properties.length} overdue propert${properties.length === 1 ? 'y' : 'ies'}, pulling now…`)

  for (const prop of properties) {
    try {
      await pullTrackedKeywords(String(prop.userId), String(prop._id))
      await pullBulkKeywords(String(prop.userId), String(prop._id))
    } catch (err) {
      console.error(`[scheduler] Pull failed for property ${prop._id}:`, err)
    }

    // Always advance nextPullAt so a failed pull doesn't leave it stuck in the past
    try {
      prop.pullSchedule.nextPullAt = updateNextPullAt(prop)
      prop.markModified('pullSchedule')
      await prop.save()
      console.log(`[scheduler] Next pull for property ${prop._id} scheduled at ${prop.pullSchedule.nextPullAt.toISOString()}`)
    } catch (err) {
      console.error(`[scheduler] Failed to advance nextPullAt for property ${prop._id}:`, err)
    }
  }
}

export default defineNitroPlugin((nitroApp) => {
  // Run immediately on startup to catch any missed scheduled pulls
  runScheduledPulls().catch((err) => {
    console.error('[scheduler] Startup check failed:', err)
  })

  // Poll every 30 minutes — this is what makes the scheduler work in dev mode,
  // where Nitro's built-in scheduledTasks do not fire.
  const interval = setInterval(() => {
    runScheduledPulls().catch((err) => {
      console.error('[scheduler] Interval check failed:', err)
    })
  }, 30 * 60 * 1000)

  // Clean up on server shutdown
  nitroApp.hooks.hookOnce('close', () => {
    clearInterval(interval)
  })
})
