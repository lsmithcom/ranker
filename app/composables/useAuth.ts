export function useAuth() {
  const { loggedIn, user, fetch: refreshSession } = useUserSession()

  const isLoggedIn = computed(() => loggedIn.value)

  async function login(email: string, password: string) {
    const data = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    await refreshSession()
    sessionStorage.setItem('sessionActive', '1')
    return data
  }

  async function register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    const data = await $fetch('/api/auth/register', {
      method: 'POST',
      body: { email, password, firstName, lastName },
    })
    await refreshSession()
    sessionStorage.setItem('sessionActive', '1')
    return data
  }

  async function logout() {
    sessionStorage.removeItem('sessionActive')
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refreshSession()
    await navigateTo('/login')
  }

  return {
    isLoggedIn,
    user,
    loggedIn,
    login,
    register,
    logout,
    refreshSession,
  }
}
