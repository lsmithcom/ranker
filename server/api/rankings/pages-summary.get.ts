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

  const pipeline = [
    {
      $match: {
        userId,
        propertyId,
        page: { $exists: true, $nin: [null, ''] },
      },
    },
    { $sort: { page: 1, keyword: 1, date: -1 } },
    {
      $group: {
        _id: { page: '$page', keyword: '$keyword' },
        source: { $first: '$source' },
        latestDate: { $first: '$date' },
        latestPosition: { $first: '$position' },
        latestClicks: { $first: '$clicks' },
        latestImpressions: { $first: '$impressions' },
        allPositions: { $push: { position: '$position', date: '$date' } },
      },
    },
    {
      $addFields: {
        previousPosition: {
          $cond: {
            if: { $gt: [{ $size: '$allPositions' }, 1] },
            then: { $arrayElemAt: ['$allPositions.position', 1] },
            else: null,
          },
        },
        previousDate: {
          $cond: {
            if: { $gt: [{ $size: '$allPositions' }, 1] },
            then: { $arrayElemAt: ['$allPositions.date', 1] },
            else: null,
          },
        },
        positionChange: {
          $cond: {
            if: { $gt: [{ $size: '$allPositions' }, 1] },
            then: {
              $round: [
                {
                  $subtract: [
                    { $arrayElemAt: ['$allPositions.position', 1] },
                    { $first: '$allPositions.position' },
                  ],
                },
                1,
              ],
            },
            else: null,
          },
        },
      },
    },
    { $sort: { '_id.page': 1, '_id.keyword': 1 } },
  ]

  const rows = await KeywordRanking.aggregate(pipeline)

  const data = rows.map((r: Record<string, unknown>) => {
    const id = r._id as { page: string; keyword: string }
    return {
      page: id.page,
      keyword: id.keyword,
      source: r.source,
      latestPosition: r.latestPosition,
      previousPosition: r.previousPosition,
      positionChange: r.positionChange,
      latestDate: r.latestDate,
      previousDate: r.previousDate,
      latestClicks: r.latestClicks,
      latestImpressions: r.latestImpressions,
    }
  })

  return { success: true, data }
})
