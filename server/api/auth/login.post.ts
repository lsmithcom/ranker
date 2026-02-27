import User from '../../models/User.js'
import { comparePassword } from '../../utils/password'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email and password are required' })
  }

  // Select passwordHash explicitly (select: false in schema)
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash')

  if (!user || !user.passwordHash) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  // Update last login timestamp
  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() })

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
