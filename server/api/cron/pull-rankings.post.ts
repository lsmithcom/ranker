import { pullTrackedKeywords, pullBulkKeywords, updateNextPullAt } from '../../utils/pull'

export default defineEventHandler(async (event) => {
  // Validate cron secret to prevent unauthorized calls
  const cronSecret = useRuntimeConfig(event).cronSecret
  if (!cronSecret) {
    throw createError({ statusCode: 500, message: 'CRON_SECRET not configured' })
  }

  const authHeader = getHeader(event, 'x-cron-secret')
  if (authHeader !== cronSecret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const Property = (await import('../../models/Property.js')).default

  const now = new Date()
  const properties = await (Property as any).find({
    'pullSchedule.isScheduled': true,
    'pullSchedule.nextPullAt': { $lte: now },
  })

  const results: { propertyId: string; success: boolean; error?: string }[] = []

  for (const prop of properties) {
    let pullError: string | undefined

    try {
      await pullTrackedKeywords(String(prop.userId), String(prop._id))
      await pullBulkKeywords(String(prop.userId), String(prop._id))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[cron] Failed to pull rankings for property ${prop._id}:`, msg)
      pullError = msg
    }

    // Always advance nextPullAt so a failed pull never leaves it stuck in the past
    try {
      prop.pullSchedule.nextPullAt = updateNextPullAt(prop)
      prop.markModified('pullSchedule')
      await prop.save()
    } catch (err: unknown) {
      console.error(`[cron] Failed to advance nextPullAt for property ${prop._id}:`, err)
    }

    results.push({ propertyId: String(prop._id), success: !pullError, error: pullError })
  }

  return {
    success: true,
    processed: properties.length,
    results,
  }
})
