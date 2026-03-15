import mongoose from 'mongoose'
import Ga4GeoMetric from '../../models/Ga4GeoMetric.js'
import { verifyPropertyOwnership } from '../../utils/verify-property.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  await verifyPropertyOwnership(String(query.propertyId || ''), user.id)

  const propertyId = new mongoose.Types.ObjectId(String(query.propertyId))
  const userId = new mongoose.Types.ObjectId(String(user.id))

  const range = String(query.range || '30d')
  const cutoff = new Date()
  if (range === '7d') cutoff.setDate(cutoff.getDate() - 7)
  else if (range === '90d') cutoff.setDate(cutoff.getDate() - 90)
  else if (range === '180d') cutoff.setDate(cutoff.getDate() - 180)
  else cutoff.setDate(cutoff.getDate() - 30)

  const data = await (Ga4GeoMetric as any).aggregate([
    { $match: { userId, propertyId, date: { $gte: cutoff } } },
    {
      $group: {
        _id: '$country',
        sessions: { $sum: '$sessions' },
        users: { $sum: '$users' },
      },
    },
    { $sort: { sessions: -1 } },
    { $limit: 20 },
    { $project: { _id: 0, country: '$_id', sessions: 1, users: 1 } },
  ])

  return { success: true, data }
})
