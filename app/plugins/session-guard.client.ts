export default defineNuxtPlugin(async () => {
  if (!sessionStorage.getItem('sessionActive')) {
    // No active browser session marker — clear any lingering server-side session cookie.
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore — the user may already be logged out.
    }
  }
})
