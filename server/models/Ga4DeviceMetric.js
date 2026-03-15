import mongoose from 'mongoose'

/**
 * Daily device-category breakdown pulled from the GA4 Data API.
 * One record per (userId, propertyId, date, deviceCategory).
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
  deviceCategory: { type: String, required: true }, // desktop | mobile | tablet
  sessions: { type: Number, default: 0 },
  users: { type: Number, default: 0 },
  screenPageViews: { type: Number, default: 0 },
  pulledAt: { type: Date, default: Date.now },
})

schema.index({ userId: 1, propertyId: 1, date: 1, deviceCategory: 1 }, { unique: true })

export default mongoose.models.Ga4DeviceMetric || mongoose.model('Ga4DeviceMetric', schema)
