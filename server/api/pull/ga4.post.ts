import { pullGa4Data } from '../../utils/ga4'
import Ga4PageMetric from '../../models/Ga4PageMetric.js'
import Ga4TrafficSource from '../../models/Ga4TrafficSource.js'
import Ga4DeviceMetric from '../../models/Ga4DeviceMetric.js'
import Ga4GeoMetric from '../../models/Ga4GeoMetric.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { propertyId, date } = body

  if (!propertyId) {
    throw createError({ statusCode: 400, message: 'propertyId is required' })
  }

  // Allow pulling a specific date (ISO string) or default to yesterday
  const targetDate = date ? new Date(date) : undefined

  try {
    await pullGa4Data(String(user.id), String(propertyId), targetDate)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    throw createError({ statusCode: 500, message: `GA4 pull failed: ${msg}` })
  }

  // Return counts of what was just stored so the caller can verify
  const pullDate = targetDate ?? (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    d.setHours(0, 0, 0, 0)
    return d
  })()

  const [pageCount, sourceCount, deviceCount, geoCount] = await Promise.all([
    (Ga4PageMetric as any).countDocuments({ userId: user.id, propertyId, date: pullDate }),
    (Ga4TrafficSource as any).countDocuments({ userId: user.id, propertyId, date: pullDate }),
    (Ga4DeviceMetric as any).countDocuments({ userId: user.id, propertyId, date: pullDate }),
    (Ga4GeoMetric as any).countDocuments({ userId: user.id, propertyId, date: pullDate }),
  ])

  return {
    success: true,
    date: pullDate.toISOString().split('T')[0],
    counts: { pages: pageCount, sources: sourceCount, devices: deviceCount, countries: geoCount },
  }
})
