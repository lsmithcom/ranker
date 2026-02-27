<template>
  <div class="max-w-4xl mx-auto px-4 py-20 text-center">
    <h1 class="text-4xl font-bold text-gray-900 mb-4">GSC Rank Tracker</h1>
    <p class="text-lg text-gray-500 mb-10">
      Track keyword rankings from Google Search Console over time.
    </p>

    <div v-if="isLoggedIn" class="flex justify-center gap-4">
      <NuxtLink
        to="/dashboard"
        class="bg-gray-900 text-white px-6 py-2.5 rounded hover:bg-gray-700 transition-colors text-sm font-medium"
      >
        Go to Dashboard
      </NuxtLink>
    </div>

    <div v-else class="flex justify-center gap-4">
      <NuxtLink
        to="/register"
        class="bg-gray-900 text-white px-6 py-2.5 rounded hover:bg-gray-700 transition-colors text-sm font-medium"
      >
        Get Started
      </NuxtLink>
      <NuxtLink
        to="/login"
        class="border border-gray-300 text-gray-700 px-6 py-2.5 rounded hover:bg-gray-100 transition-colors text-sm font-medium"
      >
        Login
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isLoggedIn } = useAuth()
</script>
