import { pullTrackedKeywords, pullBulkKeywords, updateNextPullAt } from '../../utils/pull'

export default defineTask({
  meta: {
    name: 'cron:pull-rankings',
    description: 'Auto-pull GSC rankings for scheduled properties',
  },
  async run() {
    const Property = (await import('../../models/Property.js')).default

    const now = new Date()
    const properties = await Property.find({
      'pullSchedule.isScheduled': true,
      'pullSchedule.nextPullAt': { $lte: now },
    })

    for (const prop of properties) {
      try {
        await pullTrackedKeywords(String(prop.userId), String(prop._id))
      } catch (err) {
        console.error(`[cron] pullTrackedKeywords failed for property ${prop._id}:`, err)
      }

      try {
        await pullBulkKeywords(String(prop.userId), String(prop._id))
      } catch (err) {
        console.error(`[cron] pullBulkKeywords failed for property ${prop._id}:`, err)
      }

      // Always advance nextPullAt regardless of whether the pull succeeded,
      // so a failed pull never leaves nextPullAt stuck in the past.
      try {
        prop.pullSchedule.nextPullAt = updateNextPullAt(prop)
        prop.markModified('pullSchedule')
        await prop.save()
      } catch (err) {
        console.error(`[cron] Failed to advance nextPullAt for property ${prop._id}:`, err)
      }
    }

    return { result: `Processed ${properties.length} scheduled properties` }
  },
})
