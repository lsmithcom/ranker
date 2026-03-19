<template>
  <div class="min-h-screen flex items-center justify-center bg-app-bg">
    <div class="bg-white rounded-xl shadow-sm p-8 w-full max-w-sm">
      <h1 class="text-xl font-semibold text-app-text mb-6">Development Access</h1>
      <form @submit.prevent="submit">
        <input
          v-model="passcode"
          type="password"
          placeholder="Enter passcode"
          class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
          autofocus
        />
        <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>
        <button
          type="submit"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
        >
          Enter
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const passcode = ref('')
const error = ref('')

async function submit() {
  error.value = ''
  try {
    await $fetch('/api/dev-gate', { method: 'POST', body: { passcode: passcode.value } })
    await navigateTo('/')
  } catch {
    error.value = 'Incorrect passcode'
  }
}
</script>
