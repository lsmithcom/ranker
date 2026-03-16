import mongoose from 'mongoose'

/**
 * Daily traffic source breakdown pulled from the GA4 Data API.
 * One record per (userId, propertyId, date, sessionSource, sessionMedium, sessionCampaignName).
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
  sessionSource: { type: String, default: '(none)' },
  sessionMedium: { type: String, default: '(none)' },
  sessionCampaignName: { type: String, default: '(none)' },
  sessionDefaultChannelGroup: { type: String, default: '(Other)' },
  sessions: { type: Number, default: 0 },
  users: { type: Number, default: 0 },
  newUsers: { type: Number, default: 0 },
  bounceRate: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },        // total GA4 key events / conversions
  pulledAt: { type: Date, default: Date.now },
})

schema.index(
  { userId: 1, propertyId: 1, date: 1, sessionSource: 1, sessionMedium: 1, sessionCampaignName: 1 },
  { unique: true },
)

export default mongoose.models.Ga4TrafficSource || mongoose.model('Ga4TrafficSource', schema)
