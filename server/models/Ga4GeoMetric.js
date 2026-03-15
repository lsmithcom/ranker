import mongoose from 'mongoose'

/**
 * Daily country-level metrics pulled from the GA4 Data API.
 * One record per (userId, propertyId, date, country).
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
  country: { type: String, required: true },
  sessions: { type: Number, default: 0 },
  users: { type: Number, default: 0 },
  pulledAt: { type: Date, default: Date.now },
})

schema.index({ userId: 1, propertyId: 1, date: 1, country: 1 }, { unique: true })

export default mongoose.models.Ga4GeoMetric || mongoose.model('Ga4GeoMetric', schema)
