/**
 * Security headers middleware.
 * Runs first (00. prefix) on every request.
 */
export default defineEventHandler((event) => {
  const headers: Record<string, string> = {
    // Prevent the page from being embedded in iframes (clickjacking)
    'X-Frame-Options': 'DENY',
    // Prevent MIME-type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Legacy XSS filter (still respected by some browsers)
    'X-XSS-Protection': '1; mode=block',
    // Enforce HTTPS for 1 year (only effective once served over HTTPS)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Disable browser features not used by this app
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }

  for (const [key, value] of Object.entries(headers)) {
    setResponseHeader(event, key, value)
  }
})
