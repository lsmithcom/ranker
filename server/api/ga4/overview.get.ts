import mongoose from 'mongoose'
import Ga4PageMetric from '../../models/Ga4PageMetric.js'
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
  if (range === '7d') cutoff.setDate(cutoff.getDate() - 7)
  else if (range === '90d') cutoff.setDate(cutoff.getDate() - 90)
  else if (range === '180d') cutoff.setDate(cutoff.getDate() - 180)
  else cutoff.setDate(cutoff.getDate() - 30)

  // Daily totals for charting — session-weighted bounce/engagement/duration rates
  const dailyTotals = await (Ga4PageMetric as any).aggregate([
    { $match: { userId, propertyId, date: { $gte: cutoff } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        sessions: { $sum: '$sessions' },
        users: { $sum: '$users' },
        screenPageViews: { $sum: '$screenPageViews' },
        newUsers: { $sum: '$newUsers' },
        bounceRateWeighted: { $sum: { $multiply: ['$bounceRate', '$sessions'] } },
        engagementRateWeighted: { $sum: { $multiply: ['$engagementRate', '$sessions'] } },
        durationWeighted: { $sum: { $multiply: ['$avgSessionDurationSec', '$sessions'] } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        sessions: 1,
        users: 1,
        screenPageViews: 1,
        newUsers: 1,
        bounceRate: {
          $cond: [
            { $eq: ['$sessions', 0] },
            0,
            { $round: [{ $multiply: [{ $divide: ['$bounceRateWeighted', '$sessions'] }, 100] }, 1] },
          ],
        },
        engagementRate: {
          $cond: [
            { $eq: ['$sessions', 0] },
            0,
            { $round: [{ $multiply: [{ $divide: ['$engagementRateWeighted', '$sessions'] }, 100] }, 1] },
          ],
        },
        avgSessionDurationSec: {
          $cond: [
            { $eq: ['$sessions', 0] },
            0,
            { $round: [{ $divide: ['$durationWeighted', '$sessions'] }, 1] },
          ],
        },
      },
    },
  ])

  // Channel grouping totals for the period
  const channelTotals = await (Ga4TrafficSource as any).aggregate([
    { $match: { userId, propertyId, date: { $gte: cutoff } } },
    {
      $group: {
        _id: '$sessionMedium',
        sessions: { $sum: '$sessions' },
        users: { $sum: '$users' },
      },
    },
    { $sort: { sessions: -1 } },
    {
      $project: {
        _id: 0,
        medium: '$_id',
        sessions: 1,
        users: 1,
      },
    },
  ])

  // Session-weighted summary totals for the period
  const totalRows = await (Ga4PageMetric as any).aggregate([
    { $match: { userId, propertyId, date: { $gte: cutoff } } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: '$sessions' },
        totalUsers: { $sum: '$users' },
        totalPageViews: { $sum: '$screenPageViews' },
        totalNewUsers: { $sum: '$newUsers' },
        bounceSum: { $sum: { $multiply: ['$bounceRate', '$sessions'] } },
        engagementSum: { $sum: { $multiply: ['$engagementRate', '$sessions'] } },
        durationSum: { $sum: { $multiply: ['$avgSessionDurationSec', '$sessions'] } },
      },
    },
  ])

  const t = totalRows[0] ?? {
    totalSessions: 0,
    totalUsers: 0,
    totalPageViews: 0,
    totalNewUsers: 0,
    bounceSum: 0,
    engagementSum: 0,
    durationSum: 0,
  }

  const safeDivide = (num: number, den: number) => (den === 0 ? 0 : num / den)

  return {
    success: true,
    data: {
      dailyTotals,
      channelTotals,
      totals: {
        sessions: t.totalSessions,
        users: t.totalUsers,
        pageViews: t.totalPageViews,
        newUsers: t.totalNewUsers,
        bounceRate: Math.round(safeDivide(t.bounceSum, t.totalSessions) * 1000) / 10,
        engagementRate: Math.round(safeDivide(t.engagementSum, t.totalSessions) * 1000) / 10,
        avgSessionDurationSec: Math.round(safeDivide(t.durationSum, t.totalSessions) * 10) / 10,
      },
    },
  }
})
