import mongoose from 'mongoose'
import KeywordRanking from '../../models/KeywordRanking.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  if (!query.propertyId) {
    throw createError({ statusCode: 400, message: 'propertyId is required' })
  }

  const propertyId = new mongoose.Types.ObjectId(String(query.propertyId))
  const userId = new mongoose.Types.ObjectId(String(user.id))
  const source = String(query.source || 'specific_query')

  const range = String(query.range || '30d')
  const cutoff = new Date()
  if (range === '90d') cutoff.setDate(cutoff.getDate() - 90)
  else if (range === '180d') cutoff.setDate(cutoff.getDate() - 180)
  else cutoff.setDate(cutoff.getDate() - 30)

  const raw = await KeywordRanking.aggregate([
    {
      $match: {
        userId,
        propertyId,
        source,
        date: { $gte: cutoff },
        position: { $ne: null, $gt: 0, $lte: 100 },
      },
    },
    {
      $addFields: {
        bucket: {
          $switch: {
            branches: [
              { case: { $lte: ['$position', 1] }, then: 'top1' },
              { case: { $lte: ['$position', 5] }, then: 'top2_5' },
              { case: { $lte: ['$position', 10] }, then: 'top5_10' },
              { case: { $lte: ['$position', 20] }, then: 'top10_20' },
              { case: { $lte: ['$position', 50] }, then: 'top20_50' },
            ],
            default: 'top50_100',
          },
        },
        dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
      },
    },
    {
      $group: {
        _id: { date: '$dateStr', bucket: '$bucket' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
  ])

  // Pivot into per-date objects
  const dateSet = new Set<string>()
  const map: Record<string, Record<string, number>> = {}
  for (const row of raw) {
    const date = row._id.date as string
    const bucket = row._id.bucket as string
    dateSet.add(date)
    if (!map[date]) map[date] = {}
    map[date][bucket] = row.count as number
  }

  const dates = Array.from(dateSet).sort()
  const data = dates.map((date) => ({
    date,
    top1: map[date]?.top1 ?? 0,
    top2_5: map[date]?.top2_5 ?? 0,
    top5_10: map[date]?.top5_10 ?? 0,
    top10_20: map[date]?.top10_20 ?? 0,
    top20_50: map[date]?.top20_50 ?? 0,
    top50_100: map[date]?.top50_100 ?? 0,
  }))

  return { success: true, data }
})
