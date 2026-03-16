import mongoose from 'mongoose'
import Ga4TrafficSource from '../../models/Ga4TrafficSource.js'
import { verifyPropertyOwnership } from '../../utils/verify-property.js'

/**
 * Returns sessions-by-channel time series for a stacked area chart.
 * Groups Ga4TrafficSource by (date, sessionDefaultChannelGroup), sums sessions per day per channel.
 * Response: { dates: string[], series: { channel: string, values: number[] }[] }
 */
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
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          channel: '$sessionDefaultChannelGroup',
        },
        sessions: { $sum: '$sessions' },
      },
    },
    { $sort: { '_id.date': 1 } },
  ])

  // Build a sorted date list and unique channel list
  const dateSet = new Set<string>()
  const channelSessionTotals: Record<string, number> = {}
  const map: Record<string, Record<string, number>> = {}

  for (const row of raw) {
    const date: string = row._id.date
    const channel: string = row._id.channel || '(Other)'
    dateSet.add(date)
    channelSessionTotals[channel] = (channelSessionTotals[channel] ?? 0) + row.sessions
    if (!map[date]) map[date] = {}
    map[date][channel] = row.sessions
  }

  const dates = [...dateSet].sort()

  // Sort channels by total sessions descending, keep (Other) last
  const channels = Object.keys(channelSessionTotals)
    .filter(c => c !== '(Other)')
    .sort((a, b) => channelSessionTotals[b] - channelSessionTotals[a])
  if (channelSessionTotals['(Other)'] !== undefined) channels.push('(Other)')

  const series = channels.map(channel => ({
    channel,
    values: dates.map(d => map[d]?.[channel] ?? 0),
  }))

  return { success: true, dates, series }
})
