import mongoose from 'mongoose'

/**
 * Daily per-item e-commerce metrics pulled from the GA4 Data API.
 * One record per (userId, propertyId, date, itemId).
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
  itemId: { type: String, default: '(not set)' },
  itemName: { type: String, default: '' },
  itemCategory: { type: String, default: '' },
  itemRevenue: { type: Number, default: 0 },
  itemsPurchased: { type: Number, default: 0 },
  itemsAddedToCart: { type: Number, default: 0 },
  itemsViewed: { type: Number, default: 0 },
  pulledAt: { type: Date, default: Date.now },
})

schema.index({ userId: 1, propertyId: 1, date: 1, itemId: 1 }, { unique: true })

export default mongoose.models.Ga4EcommerceItem || mongoose.model('Ga4EcommerceItem', schema)
