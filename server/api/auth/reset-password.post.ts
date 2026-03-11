import { defineEventHandler, readBody, createError } from 'h3'
import crypto from 'crypto'
import User from '#server/models/User'
import { hashUserPassword, validatePasswordStrength } from '#server/utils/password'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { token, password } = body

    if (!token || !password) {
      throw createError({ statusCode: 400, message: 'Token and password are required' })
    }

    if (!validatePasswordStrength(password)) {
      throw createError({ statusCode: 400, message: 'Password must be at least 8 characters long' })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await (User as any)
      .findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      })
      .select('+passwordResetToken +passwordResetExpires')

    if (!user) {
      throw createError({
        statusCode: 400,
        message: 'This password reset link is invalid or has expired. Please request a new one.',
      })
    }

    const newHash = await hashUserPassword(password)

    await (User as any).updateOne(
      { _id: user._id },
      {
        passwordHash: newHash,
        $unset: { passwordResetToken: '', passwordResetExpires: '' },
      }
    )

    // Clear any existing session so the user must log in with the new password
    await clearUserSession(event)

    return {
      success: true,
      message: 'Your password has been reset successfully. Please log in with your new password.',
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Reset password error:', error)
    throw createError({ statusCode: 500, message: 'An error occurred. Please try again.' })
  }
})
