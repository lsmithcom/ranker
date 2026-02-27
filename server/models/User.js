import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    select: false,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  // GSC OAuth tokens - stored encrypted, never returned by default
  gscAccessToken: {
    type: String,
    select: false,
  },
  gscRefreshToken: {
    type: String,
    select: false,
  },
  gscTokenExpiry: {
    type: Date,
    select: false,
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
  },
})

userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash
    delete ret.gscAccessToken
    delete ret.gscRefreshToken
    delete ret.gscTokenExpiry
    return ret
  },
})

export default mongoose.models.User || mongoose.model('User', userSchema)
