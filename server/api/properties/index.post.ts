import Property from '../../models/Property.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { propertyUrl, propertyName, gscSiteUrl, pullFrequency } = body

  if (!propertyUrl || !propertyName || !gscSiteUrl) {
    throw createError({
      statusCode: 400,
      message: 'propertyUrl, propertyName, and gscSiteUrl are required',
    })
  }

  // Check for duplicate gscSiteUrl per user
  const existing = await Property.findOne({ userId: user.id, gscSiteUrl: gscSiteUrl.trim() })
  if (existing) {
    throw createError({ statusCode: 409, message: 'This GSC property is already registered to your account' })
  }

  const property = await Property.create({
    userId: user.id,
    propertyUrl: propertyUrl.trim(),
    propertyName: propertyName.trim(),
    gscSiteUrl: gscSiteUrl.trim(),
    pullFrequency: pullFrequency || 'daily',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return { success: true, data: property }
})
