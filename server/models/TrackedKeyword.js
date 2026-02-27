import mongoose from 'mongoose'

const trackedKeywordSchema = new mongoose.Schema({
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
  // The exact keyword string the user wants to track
  keyword: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Optional: the expected/desired landing page for this keyword
  targetPage: {
    type: String,
    trim: true,
  },
  tags: [{ type: String, trim: true }],
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  notes: {
    type: String,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KeywordGroup',
    default: null,
  },
  // Denormalized latest snapshot for quick dashboard access
  latestPosition: { type: Number, default: null },
  latestClicks: { type: Number },
  latestImpressions: { type: Number },
  latestDate: { type: Date },
  latestPage: { type: String, default: null },
  previousPosition: { type: Number, default: null },
  previousDate: { type: Date, default: null },
  // Positive = improved (moved up), negative = declined (moved down)
  positionChange: { type: Number },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Unique compound index: one record per keyword per property per user
trackedKeywordSchema.index({ userId: 1, propertyId: 1, keyword: 1 }, { unique: true })

export default mongoose.models.TrackedKeyword || mongoose.model('TrackedKeyword', trackedKeywordSchema)
