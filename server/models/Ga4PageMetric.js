import mongoose from 'mongoose'

/**
 * Daily page-level metrics pulled from the GA4 Data API.
 * One record per (userId, propertyId, date, pagePath).
 */
const schema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true,
  },
  ga4PropertyId: { type: String, required: true },
  date: { type: Date, required: true, index: true },
  pagePath: { type: String, required: true },
  pageTitle: { type: String, default: '' },
  screenPageViews: { type: Number, default: 0 },
  sessions: { type: Number, default: 0 },
  users: { type: Number, default: 0 },
  newUsers: { type: Number, default: 0 },
  bounceRate: { type: Number, default: 0 },       // 0–1 fraction
  avgSessionDurationSec: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 },   // 0–1 fraction
  entrances: { type: Number, default: 0 },         // sessions that started on this page
  exitRate: { type: Number, default: 0 },          // 0–1 fraction of pageviews that were the last in a session
  scrolledUsers: { type: Number, default: 0 },     // users who scrolled past 90% of the page
  conversions: { type: Number, default: 0 },        // total GA4 key events / conversions
  pulledAt: { type: Date, default: Date.now },
})

schema.index({ userId: 1, propertyId: 1, date: 1, pagePath: 1 }, { unique: true })

export default mongoose.models.Ga4PageMetric || mongoose.model('Ga4PageMetric', schema)
