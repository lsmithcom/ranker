import mongoose from 'mongoose'
import KeywordRanking from '../../models/KeywordRanking.js'
import BulkKeywordMeta from '../../models/BulkKeywordMeta.js'
import { verifyPropertyOwnership } from '../../utils/verify-property.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  await verifyPropertyOwnership(String(query.propertyId || ''), user.id)

  const page = Math.max(1, parseInt(String(query.page || '1')))
  const pageSize = Math.min(5000, Math.max(1, parseInt(String(query.pageSize || '50'))))
  const skip = (page - 1) * pageSize

  const propertyId = new mongoose.Types.ObjectId(String(query.propertyId))
  const userId = new mongoose.Types.ObjectId(String(user.id))

  // Aggregate to get latest and previous position per keyword
  const pipeline = [
    {
      $match: {
        userId,
        propertyId,
        source: 'bulk_discovery',
      },
    },
    { $sort: { keyword: 1, date: -1 } },
    {
      $group: {
        _id: '$keyword',
        latestDate: { $first: '$date' },
        latestPosition: { $first: '$position' },
        latestPage: { $first: '$page' },
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
    { $sort: { _id: 1 } },
  ]

  const [countResult, rows] = await Promise.all([
    KeywordRanking.aggregate([
      ...pipeline.slice(0, 3), // match + sort + group
      { $count: 'total' },
    ]),
    KeywordRanking.aggregate([
      ...pipeline,
      { $skip: skip },
      { $limit: pageSize },
    ]),
  ])

  const total = countResult[0]?.total ?? 0

  // Fetch group assignments
  const keywords = rows.map((r: Record<string, unknown>) => String(r._id))
  const metas = await BulkKeywordMeta.find({
    userId: user.id,
    propertyId: query.propertyId,
    keyword: { $in: keywords },
  })

  const groupMap: Record<string, string | null> = {}
  for (const m of metas) {
    groupMap[m.keyword] = m.groupId ? String(m.groupId) : null
  }

  const data = rows.map((r: Record<string, unknown>) => ({
    keyword: r._id,
    latestPosition: r.latestPosition,
    previousPosition: r.previousPosition,
    positionChange: r.positionChange,
    latestPage: r.latestPage,
    latestDate: r.latestDate,
    previousDate: r.previousDate,
    latestClicks: r.latestClicks,
    latestImpressions: r.latestImpressions,
    groupId: groupMap[String(r._id)] ?? null,
  }))

  return {
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
})
