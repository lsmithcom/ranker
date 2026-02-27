import mongoose from 'mongoose'

const bulkKeywordMetaSchema = new mongoose.Schema(
  {
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
    keyword: {
      type: String,
      required: true,
      trim: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KeywordGroup',
      default: null,
    },
  },
  { timestamps: true }
)

bulkKeywordMetaSchema.index({ userId: 1, propertyId: 1, keyword: 1 }, { unique: true })

export default mongoose.models.BulkKeywordMeta || mongoose.model('BulkKeywordMeta', bulkKeywordMetaSchema)
