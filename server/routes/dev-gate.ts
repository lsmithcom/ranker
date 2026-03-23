export default defineEventHandler(async (event) => {
  const passcode = useRuntimeConfig().devPasscode
  const method = getMethod(event)

  if (method === 'POST') {
    const body = await readBody(event)
    if (body?.passcode === passcode) {
      setCookie(event, 'dev_access', passcode as string, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      })
      return sendRedirect(event, '/')
    }
    return sendRedirect(event, '/dev-gate?error=1')
  }

  const error = getQuery(event).error
  setHeader(event, 'Content-Type', 'text/html')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Development Access</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #bccefb; font-family: system-ui, sans-serif; }
    .card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.1); padding: 2rem; width: 100%; max-width: 360px; }
    h1 { font-size: 1.2rem; font-weight: 600; color: #171b24; margin-bottom: 1.5rem; }
    input { width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; padding: .625rem 1rem; font-size: .875rem; margin-bottom: 1rem; outline: none; }
    input:focus { box-shadow: 0 0 0 2px #93c5fd; }
    button { width: 100%; background: #3b82f6; color: white; font-weight: 500; border: none; border-radius: 8px; padding: .625rem; font-size: .875rem; cursor: pointer; }
    button:hover { background: #2563eb; }
    .error { color: #ef4444; font-size: .875rem; margin-bottom: .75rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Development Access</h1>
    <form method="POST" action="/dev-gate">
      <input type="password" name="passcode" placeholder="Enter passcode" autofocus />
      ${error ? '<p class="error">Incorrect passcode</p>' : ''}
      <button type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`
})
