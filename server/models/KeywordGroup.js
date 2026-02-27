import mongoose from 'mongoose'

const keywordGroupSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['tracked', 'bulk'],
      required: true,
    },
  },
  { timestamps: true }
)

keywordGroupSchema.index({ userId: 1, propertyId: 1, name: 1, type: 1 }, { unique: true })

export default mongoose.models.KeywordGroup || mongoose.model('KeywordGroup', keywordGroupSchema)
