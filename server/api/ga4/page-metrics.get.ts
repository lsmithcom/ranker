import mongoose from 'mongoose'
import Ga4PageMetric from '../../models/Ga4PageMetric.js'
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

  const limit = Math.min(parseInt(String(query.limit || '100')), 500)
  const sort = String(query.sort || 'screenPageViews') // screenPageViews | sessions | users

  // Aggregate by pagePath over the date range — sum metrics across days
  const data = await (Ga4PageMetric as any).aggregate([
    { $match: { userId, propertyId, date: { $gte: cutoff } } },
    {
      $group: {
        _id: '$pagePath',
        pageTitle: { $last: '$pageTitle' },
        screenPageViews: { $sum: '$screenPageViews' },
        sessions: { $sum: '$sessions' },
        users: { $sum: '$users' },
        newUsers: { $sum: '$newUsers' },
        bounceRate: { $avg: '$bounceRate' },
        avgSessionDurationSec: { $avg: '$avgSessionDurationSec' },
        engagementRate: { $avg: '$engagementRate' },
        entrances: { $sum: '$entrances' },
        exitRate: { $avg: '$exitRate' },
        scrolledUsers: { $sum: '$scrolledUsers' },
        conversions: { $sum: '$conversions' },
      },
    },
    { $sort: { [sort]: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        pagePath: '$_id',
        pageTitle: 1,
        screenPageViews: 1,
        sessions: 1,
        users: 1,
        newUsers: 1,
        bounceRate: { $round: ['$bounceRate', 4] },
        avgSessionDurationSec: { $round: ['$avgSessionDurationSec', 1] },
        engagementRate: { $round: ['$engagementRate', 4] },
        entrances: 1,
        exitRate: { $round: ['$exitRate', 4] },
        scrolledUsers: 1,
        conversions: 1,
      },
    },
  ])

  return { success: true, data }
})
