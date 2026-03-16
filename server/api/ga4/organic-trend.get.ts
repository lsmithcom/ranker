import mongoose from 'mongoose'
import Ga4TrafficSource from '../../models/Ga4TrafficSource.js'
import { verifyPropertyOwnership } from '../../utils/verify-property.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  await verifyPropertyOwnership(String(query.propertyId || ''), user.id)

  const propertyId = new mongoose.Types.ObjectId(String(query.propertyId))
  const userId = new mongoose.Types.ObjectId(String(user.id))

  const range = String(query.range || '30d')
  const cutoff = new Date()
  if (range === '90d') cutoff.setDate(cutoff.getDate() - 90)
  else if (range === '180d') cutoff.setDate(cutoff.getDate() - 180)
  else cutoff.setDate(cutoff.getDate() - 30)

  const raw = await (Ga4TrafficSource as any).aggregate([
    { $match: { userId, propertyId, date: { $gte: cutoff } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalSessions: { $sum: '$sessions' },
        organicSessions: {
          $sum: {
            $cond: [
              { $eq: [{ $toLower: '$sessionMedium' }, 'organic'] },
              '$sessions',
              0,
            ],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const data = raw.map((r: any) => ({
    date: r._id as string,
    totalSessions: r.totalSessions as number,
    organicSessions: r.organicSessions as number,
    organicPct: r.totalSessions > 0
      ? Math.round((r.organicSessions / r.totalSessions) * 1000) / 10
      : 0,
  }))

  return { success: true, data }
})
