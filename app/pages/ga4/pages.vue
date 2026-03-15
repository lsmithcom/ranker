<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-xl font-semibold mb-4">GA4 Analytics</h1>

    <Ga4SubNav />

    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <select
        v-model="selectedPropertyId"
        class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        <option value="">Select property…</option>
        <option v-for="p in properties" :key="p._id" :value="p._id">{{ p.propertyName }}</option>
      </select>

      <div class="flex rounded overflow-hidden border border-gray-300">
        <button
          v-for="r in ranges"
          :key="r.value"
          @click="range = r.value"
          class="px-3 py-1.5 text-sm transition-colors"
          :class="range === r.value ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
        >
          {{ r.label }}
        </button>
      </div>

      <!-- Sort selector -->
      <select
        v-model="sortField"
        class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        <option value="screenPageViews">Sort: Views</option>
        <option value="sessions">Sort: Sessions</option>
        <option value="users">Sort: Users</option>
        <option value="newUsers">Sort: New Users</option>
        <option value="bounceRate">Sort: Bounce Rate</option>
        <option value="engagementRate">Sort: Engagement Rate</option>
        <option value="avgSessionDurationSec">Sort: Avg Duration</option>
      </select>

      <!-- Search -->
      <input
        v-model="search"
        type="text"
        placeholder="Filter paths…"
        class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 w-48"
      />

      <span v-if="loading" class="text-sm text-gray-400">Loading…</span>
      <span v-if="error" class="text-sm text-red-600">{{ error }}</span>
    </div>

    <!-- Stats summary -->
    <div v-if="pages.length" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="bg-white shadow-sm rounded p-3 text-center">
        <div class="text-lg font-semibold text-gray-800">{{ totalViews.toLocaleString() }}</div>
        <div class="text-xs text-gray-400 mt-0.5">Total Views</div>
      </div>
      <div class="bg-white shadow-sm rounded p-3 text-center">
        <div class="text-lg font-semibold text-gray-800">{{ totalSessions.toLocaleString() }}</div>
        <div class="text-xs text-gray-400 mt-0.5">Total Sessions</div>
      </div>
      <div class="bg-white shadow-sm rounded p-3 text-center">
        <div class="text-lg font-semibold text-gray-800">{{ pages.length.toLocaleString() }}</div>
        <div class="text-xs text-gray-400 mt-0.5">Unique Pages</div>
      </div>
      <div class="bg-white shadow-sm rounded p-3 text-center">
        <div class="text-lg font-semibold text-gray-800">{{ filteredPages.length.toLocaleString() }}</div>
        <div class="text-xs text-gray-400 mt-0.5">Showing</div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white shadow-sm rounded overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Path</th>
              <th
                v-for="col in columns"
                :key="col.field"
                class="text-right px-4 py-2.5 text-xs font-medium uppercase cursor-pointer select-none whitespace-nowrap"
                :class="sortField === col.field ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'"
                @click="sortField = col.field"
              >
                {{ col.label }}{{ sortField === col.field ? ' ↓' : '' }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="row in filteredPages"
              :key="row.pagePath"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-2">
                <div class="truncate max-w-xs" :title="row.pagePath">{{ row.pagePath }}</div>
                <div v-if="row.pageTitle" class="text-xs text-gray-400 truncate max-w-xs" :title="row.pageTitle">{{ row.pageTitle }}</div>
              </td>
              <td class="px-4 py-2 text-right text-gray-800">{{ row.screenPageViews.toLocaleString() }}</td>
              <td class="px-4 py-2 text-right text-gray-800">{{ row.sessions.toLocaleString() }}</td>
              <td class="px-4 py-2 text-right text-gray-800">{{ row.users.toLocaleString() }}</td>
              <td class="px-4 py-2 text-right text-gray-800">{{ row.newUsers.toLocaleString() }}</td>
              <td class="px-4 py-2 text-right" :class="bounceColor(row.bounceRate)">{{ (row.bounceRate * 100).toFixed(1) }}%</td>
              <td class="px-4 py-2 text-right" :class="engageColor(row.engagementRate)">{{ (row.engagementRate * 100).toFixed(1) }}%</td>
              <td class="px-4 py-2 text-right text-gray-800">{{ formatDuration(row.avgSessionDurationSec) }}</td>
            </tr>
            <tr v-if="loading">
              <td colspan="8" class="px-4 py-8 text-center text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!filteredPages.length && selectedPropertyId">
              <td colspan="8" class="px-4 py-8 text-center text-gray-400">No pages found.</td>
            </tr>
            <tr v-else-if="!selectedPropertyId">
              <td colspan="8" class="px-4 py-8 text-center text-gray-400">Select a property above.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Property { _id: string; propertyName: string }
interface PageMetric {
  pagePath: string
  pageTitle: string
  screenPageViews: number
  sessions: number
  users: number
  newUsers: number
  bounceRate: number
  avgSessionDurationSec: number
  engagementRate: number
}

const ranges = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]

const columns = [
  { label: 'Views', field: 'screenPageViews' },
  { label: 'Sessions', field: 'sessions' },
  { label: 'Users', field: 'users' },
  { label: 'New Users', field: 'newUsers' },
  { label: 'Bounce Rate', field: 'bounceRate' },
  { label: 'Engagement', field: 'engagementRate' },
  { label: 'Avg Duration', field: 'avgSessionDurationSec' },
]

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const range = ref('30d')
const sortField = ref('screenPageViews')
const search = ref('')
const loading = ref(false)
const error = ref('')
const pages = ref<PageMetric[]>([])

const filteredPages = computed(() => {
  let list = [...pages.value]
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((p) => p.pagePath.toLowerCase().includes(q))
  }
  list.sort((a, b) => (b[sortField.value as keyof PageMetric] as number) - (a[sortField.value as keyof PageMetric] as number))
  return list
})

const totalViews = computed(() => pages.value.reduce((s, p) => s + p.screenPageViews, 0))
const totalSessions = computed(() => pages.value.reduce((s, p) => s + p.sessions, 0))

watch([selectedPropertyId, range], () => { if (selectedPropertyId.value) load() })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: PageMetric[] }>(
      `/api/ga4/page-metrics?propertyId=${selectedPropertyId.value}&range=${range.value}&limit=500`
    )
    pages.value = res.data
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    error.value = e?.data?.message || 'Failed to load'
  } finally {
    loading.value = false
  }
}

async function loadProperties() {
  try {
    const res = await $fetch<{ data: Property[] }>('/api/properties')
    properties.value = res.data
    if (properties.value.length === 1) selectedPropertyId.value = properties.value[0]._id
  } catch { }
}

function formatDuration(sec: number): string {
  if (!sec) return '0s'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function bounceColor(rate: number): string {
  const pct = rate * 100
  if (pct >= 70) return 'text-red-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-green-600'
}

function engageColor(rate: number): string {
  const pct = rate * 100
  if (pct >= 60) return 'text-green-600'
  if (pct >= 40) return 'text-amber-600'
  return 'text-red-600'
}

onMounted(loadProperties)
</script>
