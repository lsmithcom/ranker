import User from '../../models/User.js'
import { hashUserPassword, validatePasswordStrength } from '../../utils/password'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, firstName, lastName } = body

  // Validate required fields
  if (!email || !password || !firstName || !lastName) {
    throw createError({ statusCode: 400, message: 'All fields are required (email, password, firstName, lastName)' })
  }

  if (!validatePasswordStrength(password)) {
    throw createError({ statusCode: 400, message: 'Password must be at least 8 characters' })
  }

  // Check email uniqueness
  const existing = await User.findOne({ email: email.toLowerCase().trim() })
  if (existing) {
    throw createError({ statusCode: 409, message: 'An account with that email already exists' })
  }

  const passwordHash = await hashUserPassword(password)

  const user = await User.create({
    email: email.toLowerCase().trim(),
    passwordHash,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    createdAt: new Date(),
    lastLoginAt: new Date(),
  })

  await setUserSession(event, {
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  })

  return {
    success: true,
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  }
})
