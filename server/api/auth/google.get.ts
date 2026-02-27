import { getGoogleAuthUrl } from '../../utils/gsc'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Must be logged in to connect Google Search Console' })
  }

  const url = getGoogleAuthUrl()
  return sendRedirect(event, url)
})
