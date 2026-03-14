<template>
  <div class="bg-white shadow-sm rounded-lg overflow-hidden">
    <!-- Panel header -->
    <div class="px-4 py-3 border-b border-gray-100 bg-gray-50">
      <p class="text-sm font-semibold text-gray-800">{{ title }}</p>
      <p class="text-xs text-gray-400 mt-0.5">{{ subtitle }}</p>
    </div>

    <!-- Empty state -->
    <div v-if="!items.length" class="px-4 py-6 text-center text-xs text-gray-400">
      No data yet
    </div>

    <!-- Keyword rows -->
    <ul v-else class="divide-y divide-gray-50">
      <li
        v-for="item in items"
        :key="item.keyword"
        class="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span
          class="text-sm text-gray-700 truncate pr-3"
          :title="item.keyword"
        >
          {{ item.keyword }}
        </span>
        <div class="flex items-center gap-2 shrink-0">
          <span
            v-if="mode !== 'top' && item.positionChange != null"
            :class="mode === 'jumped' ? 'text-emerald-600' : 'text-rose-500'"
            class="text-xs font-medium"
          >
            {{ mode === 'jumped' ? '▲' : '▼' }} {{ Math.abs(item.positionChange).toFixed(1) }}
          </span>
          <span class="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {{ item.latestPosition != null ? item.latestPosition.toFixed(1) : '—' }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  items: { keyword: string; latestPosition: number | null; positionChange: number | null }[]
  mode: 'top' | 'jumped' | 'dropped'
}>()
</script>
