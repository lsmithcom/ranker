import { pullGa4Data } from '../../utils/ga4'

export default defineTask({
  meta: {
    name: 'cron:pull-ga4',
    description: 'Daily pull of GA4 aggregated metrics for all properties with ga4PropertyId set',
  },
  async run() {
    const Property = (await import('../../models/Property.js')).default

    // Find all active properties that have a GA4 property ID configured
    const properties = await Property.find({
      ga4PropertyId: { $ne: null, $exists: true, $ne: '' },
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
    }

    return { result: `GA4 pull complete: ${succeeded} succeeded, ${failed} failed` }
  },
})
