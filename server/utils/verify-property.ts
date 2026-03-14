import Property from '../models/Property.js'

/**
 * Verifies that the given propertyId belongs to the given userId.
 * Throws a 404 error if the property is not found or does not belong to the user.
 * Used to prevent cross-tenant data probing via propertyId query parameters.
 */
export async function verifyPropertyOwnership(propertyId: string, userId: string): Promise<void> {
  if (!propertyId) {
    throw createError({ statusCode: 400, message: 'propertyId is required' })
  }
  const property = await (Property as any).findOne({ _id: propertyId, userId })
  if (!property) {
    throw createError({ statusCode: 404, message: 'Property not found' })
  }
}
