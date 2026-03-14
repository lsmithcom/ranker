<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-xl font-semibold text-gray-900 mb-1">GSC Bulk Search Terms</h1>
    <p class="text-sm text-gray-400 mb-6">Pull all search terms from Google Search Console. Useful for discovery — these become your "Search Terms" data.</p>

    <!-- Form -->
    <div class="bg-white shadow-sm rounded p-5 mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">GSC Site URL *</label>
          <input
            v-model="form.siteUrl"
            type="text"
            placeholder="sc-domain:example.com"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
          <input
            v-model="form.startDate"
            type="date"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">End Date</label>
          <input
            v-model="form.endDate"
            type="date"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Rows per page</label>
          <select
            v-model="form.pageSize"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="500">500</option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-4 mb-4">
        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input v-model="form.useMock" type="checkbox" class="rounded border-gray-300" />
          Use mock data (no GSC connection needed)
        </label>
      </div>

      <div class="flex gap-3">
        <button
          @click="runBulk(1)"
          :disabled="loading || (!form.siteUrl && !form.useMock)"
          class="bg-gray-900 text-white px-5 py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Pulling...' : 'Pull Search Terms' }}
        </button>
        <button
          v-if="result"
          @click="result = null; error = ''"
          class="border border-gray-300 text-gray-600 px-5 py-2 rounded text-sm hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      </div>

      <p v-if="error" class="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{{ error }}</p>
    </div>

    <!-- Results -->
    <div v-if="result">
      <!-- Meta / stats bar -->
      <div class="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-4 text-sm text-blue-800 flex flex-wrap gap-4 items-center">
        <span><strong>Site:</strong> {{ result.meta.siteUrl }}</span>
        <span><strong>Dates:</strong> {{ result.meta.dateRange.startDate }} → {{ result.meta.dateRange.endDate }}</span>
        <span v-if="result.pagination.total"><strong>Total rows:</strong> {{ result.pagination.total }}</span>
        <span v-else><strong>Rows fetched:</strong> {{ result.pagination.rowsFetched }}</span>
        <span v-if="result.meta.isMock" class="text-orange-600 font-medium">MOCK DATA</span>
        <span v-else class="text-green-600 font-medium">LIVE DATA</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Processed table -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-sm font-semibold text-gray-700">Search Terms ({{ result.processed.length }} rows)</h2>

            <!-- Pagination -->
            <div v-if="result.pagination.totalPages > 1 || result.pagination.hasMore" class="flex items-center gap-2">
              <button
                @click="runBulk(currentPage - 1)"
                :disabled="currentPage <= 1 || loading"
                class="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-40"
              >
                &larr; Prev
              </button>
              <span class="text-xs text-gray-500">Page {{ currentPage }}</span>
              <button
                @click="runBulk(currentPage + 1)"
                :disabled="(!result.pagination.hasMore && currentPage >= (result.pagination.totalPages || 1)) || loading"
                class="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-40"
              >
                Next &rarr;
              </button>
            </div>
          </div>

          <div v-if="!result.processed.length" class="text-sm text-gray-400 bg-white shadow-sm rounded p-4">
            No search terms returned. Try a different date range.
          </div>

          <div v-else class="bg-white shadow-sm rounded overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th class="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Search Term</th>
                  <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">Pos</th>
                  <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">Clicks</th>
                  <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">Impr.</th>
                  <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">CTR</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(row, i) in result.processed" :key="i" class="hover:bg-gray-50">
                  <td class="px-3 py-2 text-gray-400 text-xs">{{ rowOffset + i + 1 }}</td>
                  <td class="px-3 py-2 text-gray-800">{{ row.keyword }}</td>
                  <td class="px-3 py-2 text-right font-mono text-gray-700">{{ row.position }}</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ row.clicks }}</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ row.impressions?.toLocaleString?.() ?? row.impressions }}</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ row.ctr }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Raw JSON -->
        <div>
          <h2 class="text-sm font-semibold text-gray-700 mb-2">Raw API Response</h2>
          <pre class="bg-gray-900 text-green-400 rounded p-4 text-xs overflow-auto max-h-96 font-mono leading-relaxed">{{ JSON.stringify(result.raw, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface BulkResult {
  raw: unknown
  processed: Array<{
    keyword: string
    page: string | null
    position: number | null
    clicks: number | null
    impressions: number | null
    ctr: string | null
  }>
  pagination: {
    page: number
    pageSize: number
    total?: number
    totalPages?: number
    rowsFetched?: number
    hasMore?: boolean
  }
  meta: {
    siteUrl: string
    dateRange: { startDate: string; endDate: string }
    isMock: boolean
  }
}

const today = new Date()
const defaultEnd = today.toISOString().split('T')[0]
const defaultStart = new Date(today.setDate(today.getDate() - 28)).toISOString().split('T')[0]

const form = reactive({
  siteUrl: '',
  startDate: defaultStart,
  endDate: defaultEnd,
  pageSize: 100,
  useMock: true,
})

const loading = ref(false)
const result = ref<BulkResult | null>(null)
const error = ref('')
const currentPage = ref(1)

const rowOffset = computed(() => (currentPage.value - 1) * form.pageSize)

async function runBulk(page = 1) {
  error.value = ''
  loading.value = true
  currentPage.value = page

  const params = new URLSearchParams({
    siteUrl: form.siteUrl || 'https://example.com',
    startDate: form.startDate,
    endDate: form.endDate,
    page: String(page),
    pageSize: String(form.pageSize),
    ...(form.useMock ? { mock: 'true' } : {}),
  })

  try {
    result.value = await $fetch<BulkResult>(`/api/gsc/test-bulk?${params}`)
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    error.value = e?.data?.message || e?.message || 'Bulk pull failed'
  } finally {
    loading.value = false
  }
}
</script>
