import mongoose from 'mongoose'
import Ga4EcommerceSummary from '../../models/Ga4EcommerceSummary.js'
import Ga4EcommerceItem from '../../models/Ga4EcommerceItem.js'
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

  const dateFilter = { userId, propertyId, date: { $gte: cutoff } }

  // Daily summary totals aggregated over the range
  const summaryAgg = await (Ga4EcommerceSummary as any).aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalRevenue' },
        purchases: { $sum: '$purchases' },
        itemsPurchased: { $sum: '$itemsPurchased' },
        addToCarts: { $sum: '$addToCarts' },
      },
    },
  ])

  const summary = summaryAgg[0] ?? { totalRevenue: 0, purchases: 0, itemsPurchased: 0, addToCarts: 0 }

  // Per-item totals aggregated over the range, sorted by revenue desc
  const items = await (Ga4EcommerceItem as any).aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$itemId',
        itemName: { $last: '$itemName' },
        itemCategory: { $last: '$itemCategory' },
        itemRevenue: { $sum: '$itemRevenue' },
        itemsPurchased: { $sum: '$itemsPurchased' },
        itemsAddedToCart: { $sum: '$itemsAddedToCart' },
        itemsViewed: { $sum: '$itemsViewed' },
      },
    },
    { $sort: { itemRevenue: -1 } },
    { $limit: 100 },
    {
      $project: {
        _id: 0,
        itemId: '$_id',
        itemName: 1,
        itemCategory: 1,
        itemRevenue: { $round: ['$itemRevenue', 2] },
        itemsPurchased: 1,
        itemsAddedToCart: 1,
        itemsViewed: 1,
      },
    },
  ])

  const avgOrderValue = summary.purchases > 0 ? summary.totalRevenue / summary.purchases : 0

  return {
    success: true,
    summary: {
      totalRevenue: Math.round(summary.totalRevenue * 100) / 100,
      purchases: summary.purchases,
      itemsPurchased: summary.itemsPurchased,
      addToCarts: summary.addToCarts,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    },
    items,
  }
})
