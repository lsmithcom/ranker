<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Title -->
    <h1 class="text-xl font-semibold mb-4">GA4 Analytics</h1>

    <!-- Sub-nav -->
    <Ga4SubNav />

    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <select
        v-model="selectedPropertyId"
        class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        <option value="">Select property…</option>
        <option v-for="p in properties" :key="p._id" :value="p._id">
          {{ p.propertyName }}{{ p.ga4PropertyId ? '' : ' (no GA4 ID)' }}
        </option>
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

      <span v-if="loading" class="text-sm text-gray-400">Loading…</span>
      <span v-if="error" class="text-sm text-red-600">{{ error }}</span>
    </div>

    <!-- No GA4 ID warning -->
    <div v-if="selectedProperty && !selectedProperty.ga4PropertyId" class="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded px-4 py-3 mb-6">
      No GA4 Property ID on this property. Go to
      <NuxtLink to="/settings" class="underline">Settings</NuxtLink>
      and enter the numeric GA4 property ID.
    </div>

    <template v-if="overview">

      <!-- ── Stat Cards ─────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        <div v-for="card in statCards" :key="card.label" class="bg-white shadow-sm rounded p-3 text-center">
          <div class="text-xl font-semibold text-gray-800">{{ card.value }}</div>
          <div class="text-xs text-gray-400 mt-0.5">{{ card.label }}</div>
        </div>
      </div>

      <!-- ── Primary Chart Row ───────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        <!-- Sessions + Users dual-line -->
        <div class="lg:col-span-2 bg-white shadow-sm rounded p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-700">Sessions &amp; Users</h2>
            <div class="flex gap-3 text-xs text-gray-500">
              <span class="flex items-center gap-1"><span class="inline-block w-3 h-0.5 bg-indigo-500 rounded"></span> Sessions</span>
              <span class="flex items-center gap-1"><span class="inline-block w-3 h-0.5 bg-emerald-500 rounded"></span> Users</span>
            </div>
          </div>
          <div class="h-52">
            <ClientOnly :key="range">
              <Ga4LineChart
                :labels="dateLabels"
                :datasets="sessionsUsersDatasets"
              />
            </ClientOnly>
          </div>
        </div>

        <!-- Traffic Channels -->
        <div class="bg-white shadow-sm rounded p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Traffic Channels</h2>
          <div v-if="overview.channelTotals.length" class="space-y-2.5">
            <div
              v-for="ch in overview.channelTotals.slice(0, 8)"
              :key="ch.medium"
              class="text-sm"
            >
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-gray-700 capitalize truncate max-w-[120px]" :title="ch.medium">
                  {{ ch.medium === '(none)' ? 'direct' : ch.medium }}
                </span>
                <span class="text-xs text-gray-500 ml-2">{{ pct(ch.sessions, totalChannelSessions) }}%</span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-indigo-400 rounded-full"
                  :style="{ width: pct(ch.sessions, totalChannelSessions) + '%' }"
                ></div>
              </div>
              <div class="text-xs text-gray-400 mt-0.5">{{ ch.sessions.toLocaleString() }} sessions</div>
            </div>
          </div>
          <div v-else class="text-sm text-gray-400">No data yet.</div>
        </div>
      </div>

      <!-- ── Secondary Metric Charts ─────────────────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">

        <div class="bg-white shadow-sm rounded p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-1">Bounce Rate</h2>
          <div class="text-xs text-gray-400 mb-2">Lower is better</div>
          <div class="h-36">
            <ClientOnly :key="range">
              <Ga4LineChart
                :labels="dateLabels"
                :datasets="bounceRateDataset"
                suffix="%"
              />
            </ClientOnly>
          </div>
        </div>

        <div class="bg-white shadow-sm rounded p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-1">Engagement Rate</h2>
          <div class="text-xs text-gray-400 mb-2">Higher is better</div>
          <div class="h-36">
            <ClientOnly :key="range">
              <Ga4LineChart
                :labels="dateLabels"
                :datasets="engagementRateDataset"
                suffix="%"
              />
            </ClientOnly>
          </div>
        </div>

        <div class="bg-white shadow-sm rounded p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-1">Avg Session Duration</h2>
          <div class="text-xs text-gray-400 mb-2">In seconds</div>
          <div class="h-36">
            <ClientOnly :key="range">
              <Ga4LineChart
                :labels="dateLabels"
                :datasets="durationDataset"
                :format-tooltip-value="formatDuration"
              />
            </ClientOnly>
          </div>
        </div>
      </div>

      <!-- ── Page Views Chart ────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div class="bg-white shadow-sm rounded p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Page Views</h2>
          <div class="h-40">
            <ClientOnly :key="range">
              <Ga4LineChart
                :labels="dateLabels"
                :datasets="pageViewsDataset"
              />
            </ClientOnly>
          </div>
        </div>

        <div class="bg-white shadow-sm rounded p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">New Users</h2>
          <div class="h-40">
            <ClientOnly :key="range">
              <Ga4LineChart
                :labels="dateLabels"
                :datasets="newUsersDataset"
              />
            </ClientOnly>
          </div>
        </div>
      </div>

      <!-- ── Bottom Row: Top Pages + Devices + Countries ────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- Top Pages -->
        <div class="bg-white shadow-sm rounded overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-700">Top Pages</h2>
            <NuxtLink to="/ga4/pages" class="text-xs text-indigo-600 hover:underline">See all →</NuxtLink>
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
              <tr v-for="row in pages.slice(0, 10)" :key="row.pagePath" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-700 truncate max-w-[240px]" :title="row.pagePath">{{ row.pagePath }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.screenPageViews.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.sessions.toLocaleString() }}</td>
              </tr>
              <tr v-if="!pages.length">
                <td colspan="3" class="px-4 py-6 text-center text-gray-400 text-sm">No data.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Devices + Countries stacked -->
        <div class="space-y-4">

          <!-- Devices -->
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
                  <th class="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Views</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in devices" :key="row.deviceCategory" class="hover:bg-gray-50">
                  <td class="px-4 py-2 capitalize text-gray-700">{{ row.deviceCategory }}</td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ row.sessions.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ row.users.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ row.screenPageViews.toLocaleString() }}</td>
                </tr>
                <tr v-if="!devices.length">
                  <td colspan="4" class="px-4 py-4 text-center text-gray-400 text-sm">No data.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Top Countries -->
          <div class="bg-white shadow-sm rounded overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-gray-700">Top Countries</h2>
              <NuxtLink to="/ga4/sources" class="text-xs text-indigo-600 hover:underline">See sources →</NuxtLink>
            </div>
            <div class="divide-y divide-gray-100">
              <div
                v-for="row in geo.slice(0, 8)"
                :key="row.country"
                class="px-4 py-2 flex items-center gap-3 hover:bg-gray-50"
              >
                <span class="text-sm text-gray-700 flex-1 truncate">{{ row.country }}</span>
                <div class="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-blue-400 rounded-full"
                    :style="{ width: pct(row.sessions, geo[0]?.sessions ?? 1) + '%' }"
                  ></div>
                </div>
                <span class="text-xs text-gray-500 w-14 text-right">{{ row.sessions.toLocaleString() }}</span>
              </div>
              <div v-if="!geo.length" class="px-4 py-4 text-center text-gray-400 text-sm">No data.</div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- Empty state before selection -->
    <div v-else-if="!loading && selectedPropertyId" class="text-sm text-gray-500 mt-8 text-center">
      No GA4 data found for this property and range. Try importing historical data from the
      <NuxtLink to="/import" class="text-indigo-600 hover:underline">Import</NuxtLink> page.
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
interface DailyTotal {
  date: string
  sessions: number
  users: number
  screenPageViews: number
  newUsers: number
  bounceRate: number
  engagementRate: number
  avgSessionDurationSec: number
}
interface OverviewData {
  dailyTotals: DailyTotal[]
  channelTotals: { medium: string; sessions: number; users: number }[]
  totals: {
    sessions: number
    users: number
    pageViews: number
    newUsers: number
    bounceRate: number
    engagementRate: number
    avgSessionDurationSec: number
  }
}
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
interface TrafficSource {
  source: string
  medium: string
  sessions: number
  users: number
  newUsers: number
  bounceRate: number
  engagementRate: number
}
interface DeviceMetric { deviceCategory: string; sessions: number; users: number; screenPageViews: number }
interface GeoMetric { country: string; sessions: number; users: number }

const ranges = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const range = ref('30d')
const loading = ref(false)
const error = ref('')

const overview = ref<OverviewData | null>(null)
const pages = ref<PageMetric[]>([])
const sources = ref<TrafficSource[]>([])
const devices = ref<DeviceMetric[]>([])
const geo = ref<GeoMetric[]>([])

const selectedProperty = computed(() => properties.value.find((p) => p._id === selectedPropertyId.value))

// Chart labels
const dateLabels = computed(() => (overview.value?.dailyTotals ?? []).map((d) => formatLabel(d.date)))

// Chart datasets
const sessionsUsersDatasets = computed(() => [
  {
    label: 'Sessions',
    values: (overview.value?.dailyTotals ?? []).map((d) => d.sessions),
    color: '#6366f1',
    fillColor: 'rgba(99,102,241,0.05)',
  },
  {
    label: 'Users',
    values: (overview.value?.dailyTotals ?? []).map((d) => d.users),
    color: '#10b981',
  },
])
const bounceRateDataset = computed(() => [
  {
    label: 'Bounce Rate',
    values: (overview.value?.dailyTotals ?? []).map((d) => d.bounceRate),
    color: '#ef4444',
    fillColor: 'rgba(239,68,68,0.06)',
  },
])
const engagementRateDataset = computed(() => [
  {
    label: 'Engagement Rate',
    values: (overview.value?.dailyTotals ?? []).map((d) => d.engagementRate),
    color: '#10b981',
    fillColor: 'rgba(16,185,129,0.06)',
  },
])
const durationDataset = computed(() => [
  {
    label: 'Avg Duration',
    values: (overview.value?.dailyTotals ?? []).map((d) => d.avgSessionDurationSec),
    color: '#f59e0b',
    fillColor: 'rgba(245,158,11,0.06)',
  },
])
const pageViewsDataset = computed(() => [
  {
    label: 'Page Views',
    values: (overview.value?.dailyTotals ?? []).map((d) => d.screenPageViews),
    color: '#8b5cf6',
    fillColor: 'rgba(139,92,246,0.06)',
  },
])
const newUsersDataset = computed(() => [
  {
    label: 'New Users',
    values: (overview.value?.dailyTotals ?? []).map((d) => d.newUsers),
    color: '#0ea5e9',
    fillColor: 'rgba(14,165,233,0.06)',
  },
])

// Channel totals
const totalChannelSessions = computed(() =>
  (overview.value?.channelTotals ?? []).reduce((s, c) => s + c.sessions, 0)
)

// Stat cards
const statCards = computed(() => {
  const t = overview.value?.totals
  if (!t) return []
  return [
    { label: 'Sessions', value: t.sessions.toLocaleString() },
    { label: 'Users', value: t.users.toLocaleString() },
    { label: 'Page Views', value: t.pageViews.toLocaleString() },
    { label: 'New Users', value: t.newUsers.toLocaleString() },
    { label: 'Bounce Rate', value: `${t.bounceRate}%` },
    { label: 'Engagement', value: `${t.engagementRate}%` },
    { label: 'Avg Duration', value: formatDuration(t.avgSessionDurationSec) },
  ]
})

watch([selectedPropertyId, range], () => {
  if (selectedPropertyId.value) load()
})

async function load() {
  if (!selectedPropertyId.value) return
  loading.value = true
  error.value = ''
  overview.value = null
  try {
    const pid = selectedPropertyId.value
    const r = range.value
    const [ov, pg, sr, dv, ge] = await Promise.all([
      $fetch<{ data: OverviewData }>(`/api/ga4/overview?propertyId=${pid}&range=${r}`),
      $fetch<{ data: PageMetric[] }>(`/api/ga4/page-metrics?propertyId=${pid}&range=${r}&limit=100`),
      $fetch<{ data: TrafficSource[] }>(`/api/ga4/traffic-sources?propertyId=${pid}&range=${r}`),
      $fetch<{ data: DeviceMetric[] }>(`/api/ga4/device-metrics?propertyId=${pid}&range=${r}`),
      $fetch<{ data: GeoMetric[] }>(`/api/ga4/geo-metrics?propertyId=${pid}&range=${r}`),
    ])
    overview.value = ov.data
    pages.value = pg.data
    sources.value = sr.data
    devices.value = dv.data
    geo.value = ge.data
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

function formatLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(m) - 1]} ${parseInt(d)}`
}

function formatDuration(sec: number): string {
  if (!sec) return '0s'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function pct(n: number, total: number): string {
  if (!total) return '0'
  return ((n / total) * 100).toFixed(1)
}

onMounted(loadProperties)
</script>
