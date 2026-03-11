<template>
  <div class="max-w-md mx-auto px-4 py-16">
    <h1 class="text-2xl font-bold text-gray-900 mb-8">Reset Password</h1>

    <!-- Success state -->
    <div v-if="success">
      <p class="text-sm text-gray-700 mb-6">{{ message }}</p>
      <NuxtLink to="/login" class="w-full block text-center bg-gray-900 text-white py-2.5 rounded text-sm font-medium hover:bg-gray-700 transition-colors">
        Log In
      </NuxtLink>
    </div>

    <!-- Invalid / expired token -->
    <div v-else-if="tokenError">
      <p class="text-sm text-red-600 mb-6">{{ tokenError }}</p>
      <NuxtLink to="/forgot-password" class="text-sm text-gray-900 font-medium hover:underline">Request a new reset link</NuxtLink>
    </div>

    <!-- Reset form -->
    <template v-else>
      <p class="text-sm text-gray-500 mb-6">Enter your new password below.</p>

      <form @submit.prevent="submit" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            v-model="form.password"
            type="password"
            required
            autocomplete="new-password"
            placeholder="Minimum 8 characters"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input
            v-model="form.confirm"
            type="password"
            required
            autocomplete="new-password"
            placeholder="Repeat your new password"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-gray-900 text-white py-2.5 rounded text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Saving...' : 'Set New Password' }}
        </button>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

const route = useRoute()
const token = route.params.token as string

const form = reactive({ password: '', confirm: '' })
const error = ref('')
const loading = ref(false)
const success = ref(false)
const message = ref('')
const tokenError = ref('')

if (!token) {
  tokenError.value = 'Invalid reset link. Please request a new one.'
}

async function submit() {
  error.value = ''

  if (form.password.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (form.password !== form.confirm) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    const result = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password: form.password },
    }) as any
    if (result.success) {
      success.value = true
      message.value = result.message
    }
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'An error occurred. Please try again.'
    if (msg.toLowerCase().includes('invalid or has expired')) {
      tokenError.value = msg
    } else {
      error.value = msg
    }
  } finally {
    loading.value = false
  }
}
</script>
