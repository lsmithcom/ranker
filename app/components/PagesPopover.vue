<template>
  <div class="relative inline-block">
    <button
      @click="toggle"
      class="text-gray-400 hover:text-gray-600 transition-colors"
      title="View ranking pages"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute z-50 left-0 top-6 w-72 bg-white border border-gray-200 rounded shadow-lg"
    >
      <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span class="text-xs font-medium text-gray-700">Ranking Pages</span>
        <button @click="open = false" class="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div v-if="loading" class="px-3 py-3 text-xs text-gray-400">Loading…</div>
      <div v-else-if="!pages.length" class="px-3 py-3 text-xs text-gray-400">No pages found.</div>
      <ul v-else class="max-h-48 overflow-y-auto divide-y divide-gray-50">
        <li v-for="page in pages" :key="page" class="px-3 py-2">
          <a
            :href="page"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-indigo-600 hover:underline break-all"
          >{{ page }}</a>
        </li>
      </ul>
    </div>

    <!-- Click-outside overlay -->
    <div v-if="open" class="fixed inset-0 z-40" @click="open = false" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  keyword: string
  propertyId: string
  source: 'specific_query' | 'bulk_discovery'
}>()

const open = ref(false)
const loading = ref(false)
const pages = ref<string[]>([])

async function toggle() {
  open.value = !open.value
  if (open.value && !pages.value.length) {
    await fetchPages()
  }
}

async function fetchPages() {
  loading.value = true
  try {
    const data = await $fetch<{ success: boolean; data: string[] }>('/api/rankings/pages', {
      query: {
        keyword: props.keyword,
        propertyId: props.propertyId,
        source: props.source,
      },
    })
    pages.value = data.data || []
  } catch {
    pages.value = []
  } finally {
    loading.value = false
  }
}
</script>
