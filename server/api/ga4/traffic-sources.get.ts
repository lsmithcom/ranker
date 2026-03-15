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

  const data = await (Ga4TrafficSource as any).aggregate([
    { $match: { userId, propertyId, date: { $gte: cutoff } } },
    {
      $group: {
        _id: { source: '$sessionSource', medium: '$sessionMedium' },
        sessions: { $sum: '$sessions' },
        users: { $sum: '$users' },
        newUsers: { $sum: '$newUsers' },
        bounceRate: { $avg: '$bounceRate' },
        engagementRate: { $avg: '$engagementRate' },
      },
    },
    { $sort: { sessions: -1 } },
    { $limit: 50 },
    {
      $project: {
        _id: 0,
        source: '$_id.source',
        medium: '$_id.medium',
        sessions: 1,
        users: 1,
        newUsers: 1,
        bounceRate: { $round: ['$bounceRate', 4] },
        engagementRate: { $round: ['$engagementRate', 4] },
      },
    },
  ])

  return { success: true, data }
})
