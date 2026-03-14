<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-xl font-semibold text-gray-900 mb-1">GSC Query Test</h1>
    <p class="text-sm text-gray-400 mb-6">Query Google Search Console for a specific keyword and view the raw + processed response.</p>

    <!-- Form -->
    <div class="bg-white shadow-sm rounded p-5 mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Keyword *</label>
          <input
            v-model="form.keyword"
            type="text"
            placeholder="best running shoes"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
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
          <label class="block text-xs font-medium text-gray-600 mb-1">Date Range</label>
          <div class="flex gap-2">
            <input
              v-model="form.startDate"
              type="date"
              class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <input
              v-model="form.endDate"
              type="date"
              class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input v-model="form.useMock" type="checkbox" class="rounded border-gray-300" />
          Use mock data (no GSC connection needed)
        </label>
      </div>

      <div class="flex gap-3 mt-4">
        <button
          @click="runQuery"
          :disabled="loading || !form.keyword || !form.siteUrl"
          class="bg-gray-900 text-white px-5 py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Querying...' : 'Run Query' }}
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
      <!-- Meta info -->
      <div class="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-4 text-sm text-blue-800 flex flex-wrap gap-4">
        <span><strong>Keyword:</strong> {{ result.meta.keyword }}</span>
        <span><strong>Site:</strong> {{ result.meta.siteUrl }}</span>
        <span><strong>Dates:</strong> {{ result.meta.dateRange.startDate }} → {{ result.meta.dateRange.endDate }}</span>
        <span v-if="result.meta.isMock" class="text-orange-600 font-medium">MOCK DATA</span>
        <span v-else class="text-green-600 font-medium">LIVE DATA — {{ result.processed.length }} rows</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Processed table -->
        <div>
          <h2 class="text-sm font-semibold text-gray-700 mb-2">Processed Data</h2>
          <div v-if="!result.processed.length" class="text-sm text-gray-400 bg-white shadow-sm rounded p-4">
            No data returned for this keyword in the selected date range.
          </div>
          <div v-else class="bg-white shadow-sm rounded overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Keyword</th>
                  <th class="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Page</th>
                  <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">Pos</th>
                  <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">Clicks</th>
                  <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">Impr.</th>
                  <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">CTR</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(row, i) in result.processed" :key="i" class="hover:bg-gray-50">
                  <td class="px-3 py-2 text-gray-800 max-w-[150px] truncate">{{ row.keyword }}</td>
                  <td class="px-3 py-2 text-gray-500 text-xs max-w-[150px] truncate" :title="row.page">{{ row.page }}</td>
                  <td class="px-3 py-2 text-right font-mono text-gray-700">{{ row.position }}</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ row.clicks }}</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ row.impressions?.toLocaleString() }}</td>
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

interface QueryResult {
  raw: unknown
  processed: Array<{
    keyword: string
    page: string | null
    position: number | null
    clicks: number | null
    impressions: number | null
    ctr: string | null
  }>
  meta: {
    keyword: string
    siteUrl: string
    dateRange: { startDate: string; endDate: string }
    isMock: boolean
    rowCount?: number
  }
}

// Default date range: last 28 days
const today = new Date()
const defaultEnd = today.toISOString().split('T')[0]
const defaultStart = new Date(today.setDate(today.getDate() - 28)).toISOString().split('T')[0]

const form = reactive({
  keyword: '',
  siteUrl: '',
  startDate: defaultStart,
  endDate: defaultEnd,
  useMock: true,
})

const loading = ref(false)
const result = ref<QueryResult | null>(null)
const error = ref('')

async function runQuery() {
  if (!form.keyword || !form.siteUrl) return
  error.value = ''
  result.value = null
  loading.value = true

  try {
    result.value = await $fetch<QueryResult>('/api/gsc/test-query', {
      method: 'POST',
      body: {
        keyword: form.keyword,
        siteUrl: form.siteUrl,
        startDate: form.startDate,
        endDate: form.endDate,
        useMock: form.useMock,
      },
    })
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    error.value = e?.data?.message || e?.message || 'Query failed'
  } finally {
    loading.value = false
  }
}
</script>
