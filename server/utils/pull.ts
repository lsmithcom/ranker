import { getGscClient } from './gsc'
import Property from '../models/Property.js'
import TrackedKeyword from '../models/TrackedKeyword.js'
import KeywordRanking from '../models/KeywordRanking.js'

function advanceSchedule(sched: { frequency: string; nextPullAt: Date; pullHour: number }): Date {
  const { frequency, nextPullAt, pullHour } = sched
  const now = new Date()
  const base = new Date(nextPullAt)

  do {
    if (frequency === 'daily') {
      base.setDate(base.getDate() + 1)
    } else if (frequency === 'weekly') {
      base.setDate(base.getDate() + 7)
    } else if (frequency === 'monthly') {
      base.setMonth(base.getMonth() + 1)
    } else {
      break
    }
    base.setHours(pullHour, 0, 0, 0)
  } while (base <= now)

  return base
}

/**
 * Computes the next scheduled GSC pull time.
 */
export function updateNextPullAt(property: {
  pullSchedule: { frequency: string; nextPullAt: Date; pullHour: number }
}): Date {
  return advanceSchedule(property.pullSchedule)
}

/**
 * Computes the next scheduled GA4 pull time.
 */
export function updateNextGa4PullAt(property: {
  ga4PullSchedule: { frequency: string; nextPullAt: Date; pullHour: number }
}): Date {
  return advanceSchedule(property.ga4PullSchedule)
}

/**
 * Pulls GSC data for all active tracked keywords for a property.
 * Upserts KeywordRanking records and updates denormalized fields on TrackedKeyword.
 */
export async function pullTrackedKeywords(userId: string, propertyId: string) {
  const property = await (Property as any).findOne({ _id: propertyId, userId })
  if (!property) throw new Error('Property not found')

  const { searchConsole } = await getGscClient(userId)

  const keywords = await (TrackedKeyword as any).find({ userId, propertyId, isActive: true })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const end = new Date().toISOString().split('T')[0]
  const startD = new Date()
  startD.setDate(startD.getDate() - 28)
  const start = startD.toISOString().split('T')[0]

  for (const kw of keywords) {
    try {
      const response = await searchConsole.searchanalytics.query({
        siteUrl: property.gscSiteUrl,
        requestBody: {
          startDate: start,
          endDate: end,
          dimensions: ['query', 'page'],
          rowLimit: 25000,
          dimensionFilterGroups: [{
            filters: [{
              dimension: 'query',
              operator: 'equals',
              expression: kw.keyword,
            }],
          }],
        },
      })

      const rows = response.data.rows || []

      // Find the best-ranked page (lowest position number)
      let bestRow: { position: number; page: string; clicks: number; impressions: number; ctr: number } | null = null
      for (const row of rows) {
        const pos = row.position ?? Infinity
        if (!bestRow || pos < bestRow.position) {
          bestRow = {
            position: pos,
            page: (row.keys || [])[1] || '',
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
          }
        }
      }

      if (bestRow) {
        const roundedPos = Math.round(bestRow.position * 10) / 10

        // Upsert ranking record for today
        await (KeywordRanking as any).findOneAndUpdate(
          { userId, propertyId, keyword: kw.keyword, date: today, source: 'specific_query' },
          {
            $set: {
              trackedKeywordId: kw._id,
              page: bestRow.page,
              position: roundedPos,
              clicks: bestRow.clicks,
              impressions: bestRow.impressions,
              ctr: bestRow.ctr,
            },
          },
          { upsert: true, new: true }
        )

        // Update denormalized fields on TrackedKeyword
        const previousPosition = kw.latestPosition ?? null
        const previousDate = kw.latestDate ?? null
        const positionChange = previousPosition !== null ? Math.round((previousPosition - roundedPos) * 10) / 10 : 0

        await (TrackedKeyword as any).updateOne(
          { _id: kw._id },
          {
            $set: {
              previousPosition,
              previousDate,
              latestPosition: roundedPos,
              latestPage: bestRow.page,
              latestClicks: bestRow.clicks,
              latestImpressions: bestRow.impressions,
              latestDate: today,
              positionChange,
            },
          }
        )
      }
    } catch {
      console.error(`[pull] Error pulling keyword "${kw.keyword}"`)
    }
  }

  await (Property as any).updateOne({ _id: propertyId }, { $set: { lastPulledAt: new Date() } })
}

/**
 * Bulk-pulls all GSC search terms for a property and upserts them as KeywordRanking records.
 */
export async function pullBulkKeywords(userId: string, propertyId: string) {
  const property = await (Property as any).findOne({ _id: propertyId, userId })
  if (!property) throw new Error('Property not found')

  const { searchConsole } = await getGscClient(userId)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const end = new Date().toISOString().split('T')[0]
  const startD = new Date()
  startD.setDate(startD.getDate() - 28)
  const start = startD.toISOString().split('T')[0]

  const pageSize = 25000
  let startRow = 0
  let hasMore = true

  while (hasMore) {
    const response = await searchConsole.searchanalytics.query({
      siteUrl: property.gscSiteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ['query', 'page'],
        rowLimit: pageSize,
        startRow,
      },
    })

    const rows = response.data.rows || []

    for (const row of rows) {
      const keys = row.keys || []
      const keyword = keys[0] || ''
      const page = keys[1] || ''
      const position = row.position ? Math.round(row.position * 10) / 10 : null

      await (KeywordRanking as any).findOneAndUpdate(
        { userId, propertyId, keyword, date: today, source: 'bulk_discovery' },
        {
          $set: {
            page,
            position,
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
          },
        },
        { upsert: true, new: true }
      )
    }

    if (rows.length < pageSize) {
      hasMore = false
    } else {
      startRow += pageSize
    }
  }

  await (Property as any).updateOne({ _id: propertyId }, { $set: { lastPulledAt: new Date() } })
}
