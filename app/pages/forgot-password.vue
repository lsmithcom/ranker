<template>
  <div class="max-w-md mx-auto px-4 py-16">
    <h1 class="text-2xl font-bold text-gray-900 mb-8">Forgot Password</h1>

    <div v-if="submitted">
      <p class="text-sm text-gray-700 mb-6">{{ message }}</p>
      <NuxtLink to="/login" class="text-sm text-gray-900 font-medium hover:underline">&larr; Back to Login</NuxtLink>
    </div>

    <template v-else>
      <p class="text-sm text-gray-500 mb-6">
        Enter the email address for your account and we'll send you a link to reset your password.
      </p>

      <form @submit.prevent="submit" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-gray-900 text-white py-2.5 rounded text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>

      <p class="mt-6 text-sm text-gray-500 text-center">
        <NuxtLink to="/login" class="text-gray-900 font-medium hover:underline">&larr; Back to Login</NuxtLink>
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

const email = ref('')
const error = ref('')
const loading = ref(false)
const submitted = ref(false)
const message = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const result = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    }) as any
    if (result.success) {
      submitted.value = true
      message.value = result.message
    }
  } catch (err: any) {
    error.value = err?.data?.message || err?.message || 'An error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
