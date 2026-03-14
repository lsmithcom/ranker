<template>
  <div class="min-h-screen flex flex-col bg-app-bg text-app-text">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-14">
          <!-- Logo / Brand -->
          <NuxtLink to="/" class="text-lg font-bold text-gray-900 tracking-tight">
            Bebop
          </NuxtLink>

          <!-- Nav links -->
          <nav class="flex items-center gap-6">
            <template v-if="isLoggedIn">
              <NuxtLink
                to="/dashboard"
                class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                active-class="text-gray-900 font-medium"
              >
                Dashboard
              </NuxtLink>
              <NuxtLink
                to="/keywords"
                class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                active-class="text-gray-900 font-medium"
              >
                Keywords
              </NuxtLink>
              <NuxtLink
                to="/search-terms"
                class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                active-class="text-gray-900 font-medium"
              >
                Search Terms
              </NuxtLink>
              <NuxtLink
                to="/pages"
                class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                active-class="text-gray-900 font-medium"
              >
                Pages
              </NuxtLink>
              <NuxtLink
                to="/schedule"
                class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                active-class="text-gray-900 font-medium"
              >
                Schedule
              </NuxtLink>
              <NuxtLink
                to="/import"
                class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                active-class="text-gray-900 font-medium"
              >
                Import
              </NuxtLink>
              <NuxtLink
                to="/settings"
                class="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                active-class="text-gray-700"
              >{{ user?.firstName }}</NuxtLink>
              <button
                @click="logout"
                class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </template>
            <template v-else>
              <NuxtLink
                to="/login"
                class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
              </NuxtLink>
              <NuxtLink
                to="/register"
                class="text-sm bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700 transition-colors"
              >
                Register
              </NuxtLink>
            </template>
          </nav>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p class="text-xs text-gray-400 text-center">Bebop Da Doo Bop</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { isLoggedIn, user, logout } = useAuth()
</script>
