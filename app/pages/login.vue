<template>
  <div class="max-w-md mx-auto px-4 py-16">
    <h1 class="text-2xl font-semibold text-gray-900 mb-8">Login</h1>

    <form @submit.prevent="submit" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          v-model="form.email"
          type="email"
          required
          autocomplete="email"
          class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          v-model="form.password"
          type="password"
          required
          autocomplete="current-password"
          class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="flex items-center justify-between">
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-gray-900 text-white py-2.5 rounded text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </div>

      <p class="text-sm text-center">
        <NuxtLink to="/forgot-password" class="text-gray-500 hover:text-gray-900 hover:underline">Forgot password?</NuxtLink>
      </p>
    </form>

    <p class="mt-6 text-sm text-gray-500 text-center">
      Don't have an account?
      <NuxtLink to="/register" class="text-gray-900 font-medium hover:underline">Register</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

const { login } = useAuth()

const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await login(form.email, form.password)
    await navigateTo('/dashboard')
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    error.value = e?.data?.message || e?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
