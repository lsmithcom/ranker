import { defineEventHandler, readBody, createError } from 'h3'
import crypto from 'crypto'
import User from '../../models/User'
import { sendEmail, generatePasswordResetHTML, generatePasswordResetText } from '../../utils/email'

const SUCCESS_RESPONSE = {
  success: true,
  message: 'If an account exists for this email address, a password reset link has been sent.',
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email } = body

    if (!email || typeof email !== 'string') {
      throw createError({ statusCode: 400, message: 'Email address is required' })
    }

    const user = await (User as any).findOne({ email: email.toLowerCase().trim() })

    // Always return success — prevents account enumeration
    if (!user) {
      return SUCCESS_RESPONSE
    }

    // Generate plain token, store only its SHA-256 hash
    const plainToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await (User as any).updateOne(
      { _id: user._id },
      { passwordResetToken: hashedToken, passwordResetExpires: expiry }
    )

    const config = useRuntimeConfig()
    const siteUrl = config.siteUrl || 'http://localhost:3000'
    const resetUrl = `${siteUrl}/reset-password/${plainToken}`

    // Fire-and-forget — don't block response on email delivery
    sendEmail({
      to: user.email,
      subject: 'Password Reset - Ranker',
      htmlBody: generatePasswordResetHTML({ name: user.firstName, resetUrl }),
      textBody: generatePasswordResetText({ name: user.firstName, resetUrl }),
    }).catch((err: any) => {
      console.error('Failed to send password reset email to', user.email, err)
    })

    return SUCCESS_RESPONSE
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Forgot password error:', error)
    throw createError({ statusCode: 500, message: 'An error occurred. Please try again.' })
  }
})
