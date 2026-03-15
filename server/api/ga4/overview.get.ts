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
  if (range === '90d') cutoff.setDate(cutoff.getDate() - 90)
  else if (range === '180d') cutoff.setDate(cutoff.getDate() - 180)
  else cutoff.setDate(cutoff.getDate() - 30)

  // Daily totals for charting (sessions, users, pageviews over time)
  const dailyTotals = await (Ga4PageMetric as any).aggregate([
    { $match: { userId, propertyId, date: { $gte: cutoff } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        sessions: { $sum: '$sessions' },
        users: { $sum: '$users' },
        screenPageViews: { $sum: '$screenPageViews' },
        newUsers: { $sum: '$newUsers' },
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

  // Summary totals for the period
  const totalRows = await (Ga4PageMetric as any).aggregate([
    { $match: { userId, propertyId, date: { $gte: cutoff } } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: '$sessions' },
        totalUsers: { $sum: '$users' },
        totalPageViews: { $sum: '$screenPageViews' },
        totalNewUsers: { $sum: '$newUsers' },
        avgBounceRate: { $avg: '$bounceRate' },
        avgEngagementRate: { $avg: '$engagementRate' },
      },
    },
  ])

  const totals = totalRows[0] ?? {
    totalSessions: 0,
    totalUsers: 0,
    totalPageViews: 0,
    totalNewUsers: 0,
    avgBounceRate: 0,
    avgEngagementRate: 0,
  }

  return {
    success: true,
    data: {
      dailyTotals,
      channelTotals,
      totals: {
        sessions: totals.totalSessions,
        users: totals.totalUsers,
        pageViews: totals.totalPageViews,
        newUsers: totals.totalNewUsers,
        bounceRate: Math.round((totals.avgBounceRate ?? 0) * 1000) / 10, // as %
        engagementRate: Math.round((totals.avgEngagementRate ?? 0) * 1000) / 10, // as %
      },
    },
  }
})
