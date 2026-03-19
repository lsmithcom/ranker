export default defineEventHandler(async (event) => {
  const { passcode } = await readBody(event)
  const expected = useRuntimeConfig().devPasscode

  if (!expected || passcode !== expected) {
    throw createError({ statusCode: 401, message: 'Wrong passcode' })
  }

  setCookie(event, 'dev_access', expected, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  return { ok: true }
})
