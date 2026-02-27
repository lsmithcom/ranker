import mongoose from 'mongoose'

const keywordRankingSchema = new mongoose.Schema({
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
  // The actual keyword/search term string
  keyword: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  // Null for bulk-discovered search terms, set for tracked keywords
  trackedKeywordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrackedKeyword',
    default: null,
  },
  // The page URL that ranked for this keyword
  page: {
    type: String,
  },
  // Average position in search results (lower = better)
  position: {
    type: Number,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  impressions: {
    type: Number,
    default: 0,
  },
  ctr: {
    type: Number,
    default: 0,
  },
  // The date this ranking data represents (YYYY-MM-DD day boundary)
  date: {
    type: Date,
    required: true,
    index: true,
  },
  // 'specific_query' = pulled for a user-tracked keyword
  // 'bulk_discovery' = discovered via GSC bulk search term download
  source: {
    type: String,
    enum: ['specific_query', 'bulk_discovery'],
    required: true,
  },
})

// Time-series compound indexes for performance
keywordRankingSchema.index({ userId: 1, propertyId: 1, keyword: 1, date: -1 })
keywordRankingSchema.index({ userId: 1, trackedKeywordId: 1, date: -1 })
keywordRankingSchema.index({ userId: 1, propertyId: 1, date: -1 })

// Prevent duplicate entries for same keyword+property+date+source
keywordRankingSchema.index(
  { userId: 1, propertyId: 1, keyword: 1, date: 1, source: 1 },
  { unique: true }
)

export default mongoose.models.KeywordRanking || mongoose.model('KeywordRanking', keywordRankingSchema)
