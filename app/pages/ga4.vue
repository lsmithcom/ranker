<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-xl font-semibold mb-6">GA4 Analytics</h1>

    <!-- Controls -->
    <div class="bg-white shadow-sm rounded p-4 mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Property</label>
          <select
            v-model="selectedPropertyId"
            class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="">Select property…</option>
            <option v-for="p in properties" :key="p._id" :value="p._id">
              {{ p.propertyName }} {{ p.ga4PropertyId ? `(GA4: ${p.ga4PropertyId})` : '(no GA4 ID)' }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">Range</label>
          <select
            v-model="range"
            class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="180d">Last 180 days</option>
          </select>
        </div>

        <button
          @click="loadResults"
          :disabled="!selectedPropertyId || loading"
          class="text-sm border border-gray-300 px-4 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {{ loading ? 'Loading…' : 'Refresh' }}
        </button>
      </div>

      <div v-if="error" class="mt-3 text-sm px-3 py-2 rounded bg-red-50 text-red-700">{{ error }}</div>
    </div>

    <!-- No GA4 ID warning -->
    <div v-if="selectedProperty && !selectedProperty.ga4PropertyId" class="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded px-4 py-3 mb-6">
      This property has no GA4 Property ID configured. Go to
      <NuxtLink to="/settings" class="underline">Settings</NuxtLink>
      and enter the numeric GA4 property ID (e.g. <code>316754772</code>).
    </div>

    <!-- No data yet -->
    <div v-else-if="selectedPropertyId && !loading && !results" class="text-sm text-gray-500">
      No data loaded. Select a property above.
    </div>

    <!-- Results -->
    <div v-if="results" class="space-y-6">

      <!-- Overview metric cards -->
      <div class="bg-white shadow-sm rounded p-4">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">Overview ({{ rangeLabelMap[range] }})</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div class="text-center">
            <div class="text-2xl font-semibold text-gray-800">{{ results.overview.totals.sessions.toLocaleString() }}</div>
            <div class="text-xs text-gray-400 mt-0.5">Sessions</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-semibold text-gray-800">{{ results.overview.totals.users.toLocaleString() }}</div>
            <div class="text-xs text-gray-400 mt-0.5">Users</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-semibold text-gray-800">{{ results.overview.totals.pageViews.toLocaleString() }}</div>
            <div class="text-xs text-gray-400 mt-0.5">Page Views</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-semibold text-gray-800">{{ results.overview.totals.newUsers.toLocaleString() }}</div>
            <div class="text-xs text-gray-400 mt-0.5">New Users</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-semibold text-gray-800">{{ results.overview.totals.bounceRate }}%</div>
            <div class="text-xs text-gray-400 mt-0.5">Bounce Rate</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-semibold text-gray-800">{{ results.overview.totals.engagementRate }}%</div>
            <div class="text-xs text-gray-400 mt-0.5">Engagement</div>
          </div>
        </div>
      </div>

      <!-- Daily totals table -->
      <div class="bg-white shadow-sm rounded overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Daily Totals ({{ results.overview.dailyTotals.length }} days)</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Sessions</th>
                <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Users</th>
                <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Page Views</th>
                <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">New Users</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in results.overview.dailyTotals.slice().reverse()" :key="row.date" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-600">{{ row.date }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.sessions.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.users.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.screenPageViews.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.newUsers.toLocaleString() }}</td>
              </tr>
              <tr v-if="!results.overview.dailyTotals.length">
                <td colspan="5" class="px-4 py-6 text-center text-gray-400 text-sm">No data — pull GA4 data first from the <NuxtLink to="/schedule" class="underline">Schedule</NuxtLink> page.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Traffic sources -->
      <div class="bg-white shadow-sm rounded overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Traffic Sources (top 50)</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Source</th>
                <th class="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Medium</th>
                <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Sessions</th>
                <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Users</th>
                <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">New Users</th>
                <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Engagement %</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in results.sources" :key="`${row.source}/${row.medium}`" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-700">{{ row.source }}</td>
                <td class="px-4 py-2 text-gray-500">{{ row.medium }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.sessions.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.users.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.newUsers.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ (row.engagementRate * 100).toFixed(1) }}%</td>
              </tr>
              <tr v-if="!results.sources.length">
                <td colspan="6" class="px-4 py-6 text-center text-gray-400 text-sm">No data yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Device + Top pages side by side -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-white shadow-sm rounded overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Devices</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Device</th>
                <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Sessions</th>
                <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Users</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in results.devices" :key="row.deviceCategory" class="hover:bg-gray-50">
                <td class="px-4 py-2 capitalize text-gray-700">{{ row.deviceCategory }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.sessions.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.users.toLocaleString() }}</td>
              </tr>
              <tr v-if="!results.devices.length">
                <td colspan="3" class="px-4 py-6 text-center text-gray-400 text-sm">No data yet.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-white shadow-sm rounded overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Top Pages (top 20)</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Path</th>
                <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Views</th>
                <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Sessions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in results.pages.slice(0, 20)" :key="row.pagePath" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-700 truncate max-w-[200px]" :title="row.pagePath">{{ row.pagePath }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.screenPageViews.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.sessions.toLocaleString() }}</td>
              </tr>
              <tr v-if="!results.pages.length">
                <td colspan="3" class="px-4 py-6 text-center text-gray-400 text-sm">No data yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Property {
  _id: string
  propertyName: string
  ga4PropertyId: string | null
}

const rangeLabelMap: Record<string, string> = {
  '30d': 'last 30 days',
  '90d': 'last 90 days',
  '180d': 'last 180 days',
}

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const range = ref('30d')
const loading = ref(false)
const error = ref('')
const results = ref<{
  overview: { dailyTotals: any[]; totals: any }
  pages: any[]
  sources: any[]
  devices: any[]
} | null>(null)

const selectedProperty = computed(() => properties.value.find((p) => p._id === selectedPropertyId.value))

watch([selectedPropertyId, range], () => {
  if (selectedPropertyId.value) loadResults()
})

async function loadResults() {
  if (!selectedPropertyId.value) return
  loading.value = true
  error.value = ''
  try {
    const [overview, pages, sources, devices] = await Promise.all([
      $fetch<{ data: any }>(`/api/ga4/overview?propertyId=${selectedPropertyId.value}&range=${range.value}`),
      $fetch<{ data: any[] }>(`/api/ga4/page-metrics?propertyId=${selectedPropertyId.value}&range=${range.value}&limit=100`),
      $fetch<{ data: any[] }>(`/api/ga4/traffic-sources?propertyId=${selectedPropertyId.value}&range=${range.value}`),
      $fetch<{ data: any[] }>(`/api/ga4/device-metrics?propertyId=${selectedPropertyId.value}&range=${range.value}`),
    ])
    results.value = {
      overview: overview.data,
      pages: pages.data,
      sources: sources.data,
      devices: devices.data,
    }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    error.value = e?.data?.message || 'Failed to load data'
  } finally {
    loading.value = false
  }
}

async function loadProperties() {
  try {
    const res = await $fetch<{ data: Property[] }>('/api/properties')
    properties.value = res.data
    if (properties.value.length === 1) {
      selectedPropertyId.value = properties.value[0]._id
    }
  } catch {
    // silent
  }
}

onMounted(loadProperties)
</script>
