import mongoose from 'mongoose'

const propertySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // User-friendly URL (e.g., https://example.com)
  propertyUrl: {
    type: String,
    required: true,
    trim: true,
  },
  // Display name chosen by user
  propertyName: {
    type: String,
    required: true,
    trim: true,
  },
  // Exact GSC site URL (may be sc-domain:example.com or https://example.com/)
  gscSiteUrl: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastPulledAt: {
    type: Date,
  },
  pullFrequency: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily',
  },
  pullSchedule: {
    isScheduled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    startDate: Date,
    nextPullAt: Date,
    pullHour: { type: Number, default: 12 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Compound index to prevent duplicate properties per user
propertySchema.index({ userId: 1, gscSiteUrl: 1 }, { unique: true })

export default mongoose.models.Property || mongoose.model('Property', propertySchema)
