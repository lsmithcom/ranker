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

  const range = String(query.range || '30d')
  const cutoff = new Date()
  if (range === '90d') cutoff.setDate(cutoff.getDate() - 90)
  else if (range === '180d') cutoff.setDate(cutoff.getDate() - 180)
  else cutoff.setDate(cutoff.getDate() - 30)

  const data = await KeywordRanking.aggregate([
    { $match: { userId, propertyId, date: { $gte: cutoff } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        avgPosition: { $avg: '$position' },
        totalClicks: { $sum: '$clicks' },
        uniqueKeywords: { $addToSet: '$keyword' },
      },
    },
    { $addFields: { uniqueTerms: { $size: '$uniqueKeywords' } } },
    { $project: { uniqueKeywords: 0 } },
    { $sort: { _id: 1 } },
  ])

  return {
    success: true,
    data: data.map((d) => ({
      date: d._id as string,
      avgPosition: Math.round(d.avgPosition * 10) / 10,
      totalClicks: d.totalClicks as number,
      uniqueTerms: d.uniqueTerms as number,
    })),
  }
})
