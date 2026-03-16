<template>
  <nav class="flex gap-0 border-b border-gray-200 mb-6">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="px-4 py-2 text-sm -mb-px border-b-2 transition-colors whitespace-nowrap"
      :class="
        isActive(tab.to)
          ? 'border-gray-900 text-gray-900 font-medium'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      "
    >
      {{ tab.label }}
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()

const tabs = [
  { label: 'Overview', to: '/ga4' },
  { label: 'Pages', to: '/ga4/pages' },
  { label: 'Sources', to: '/ga4/sources' },
  { label: 'Audience', to: '/ga4/audience' },
  { label: 'Conversions', to: '/ga4/conversions' },
]

function isActive(to: string): boolean {
  if (to === '/ga4') return route.path === '/ga4'
  return route.path.startsWith(to)
}
</script>
