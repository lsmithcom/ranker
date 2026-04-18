import { pullGa4Data } from '../../utils/ga4'
import { updateNextGa4PullAt } from '../../utils/pull'

export default defineTask({
  meta: {
    name: 'cron:pull-ga4',
    description: 'Auto-pull GA4 metrics for scheduled properties',
  },
  async run() {
    const Property = (await import('../../models/Property.js')).default

    const now = new Date()
    const properties = await Property.find({
      'ga4PullSchedule.isScheduled': true,
      'ga4PullSchedule.nextPullAt': { $lte: now },
      ga4PropertyId: { $exists: true, $nin: [null, ''] },
      isActive: true,
    })

    let succeeded = 0
    let failed = 0

    for (const prop of properties) {
      try {
        await pullGa4Data(String(prop.userId), String(prop._id))
        succeeded++
      } catch (err) {
        failed++
        console.error(`[cron:pull-ga4] Failed for property ${prop._id}:`, err)
      }

      // Always advance nextPullAt regardless of pull success, so a failed pull
      // never leaves nextPullAt stuck in the past.
      try {
        prop.ga4PullSchedule.nextPullAt = updateNextGa4PullAt(prop)
        prop.markModified('ga4PullSchedule')
        await prop.save()
      } catch (err) {
        console.error(`[cron:pull-ga4] Failed to advance nextPullAt for property ${prop._id}:`, err)
      }
    }

    return { result: `GA4 pull complete: ${succeeded} succeeded, ${failed} failed` }
  },
})
