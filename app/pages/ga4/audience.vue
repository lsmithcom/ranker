<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-xl font-semibold mb-4">GA4 Analytics</h1>
    <Ga4SubNav />

    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <select v-model="selectedPropertyId" class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
        <option value="">Select property…</option>
        <option v-for="p in properties" :key="p._id" :value="p._id">{{ p.propertyName }}</option>
      </select>
      <div class="flex rounded overflow-hidden border border-gray-300">
        <button v-for="r in ranges" :key="r.value" @click="range = r.value"
          class="px-3 py-1.5 text-sm transition-colors"
          :class="range === r.value ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'">
          {{ r.label }}
        </button>
      </div>
      <span v-if="loading" class="text-sm text-gray-400">Loading…</span>
      <span v-if="error" class="text-sm text-red-600">{{ error }}</span>
    </div>

    <template v-if="overview && devices.length">

      <!-- ── A1 Device Split ──────────────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">Device Split</h2>
        <p class="text-xs text-gray-500 mb-3">Understand how your audience accesses your site. Critical for mobile-first indexing — if mobile share is high, prioritise mobile UX and Core Web Vitals.</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div v-for="(d, i) in deviceCards" :key="d.device"
            class="bg-white shadow-sm rounded-lg p-5 border-l-4"
            :style="{ borderColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 capitalize">{{ d.device }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                :style="{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }">
                {{ d.sessionPct.toFixed(0) }}%
              </span>
            </div>
            <div class="text-2xl font-bold text-gray-900 mb-1">{{ d.sessions.toLocaleString() }}</div>
            <div class="text-xs text-gray-400">sessions</div>
            <div class="mt-3 text-xs text-gray-500">
              {{ d.users.toLocaleString() }} users · {{ d.views.toLocaleString() }} views
            </div>
            <div class="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full" :style="{ width: `${d.sessionPct}%`, backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }"></div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Sessions by Device</h3>
            <div class="flex items-center gap-6 justify-center">
              <div class="h-52 w-52">
                <ClientOnly>
                  <SearchDonutChart :segments="deviceDonutSessions" />
                </ClientOnly>
              </div>
              <div class="space-y-3">
                <div v-for="(d, i) in deviceCards" :key="d.device" class="flex items-center gap-2 text-sm">
                  <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }"></span>
                  <span class="capitalize text-gray-700">{{ d.device }}</span>
                  <span class="text-gray-400 ml-auto pl-4">{{ d.sessionPct.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Page Views by Device</h3>
            <div class="flex items-center gap-6 justify-center">
              <div class="h-52 w-52">
                <ClientOnly>
                  <SearchDonutChart :segments="deviceDonutViews" />
                </ClientOnly>
              </div>
              <div class="space-y-3">
                <div v-for="(d, i) in deviceCards" :key="d.device" class="flex items-center gap-2 text-sm">
                  <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }"></span>
                  <span class="capitalize text-gray-700">{{ d.device }}</span>
                  <span class="text-gray-400 ml-auto pl-4">{{ d.viewPct.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── A2 + D1 New vs Returning / User Loyalty ─────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">User Loyalty — New vs Returning</h2>
        <p class="text-xs text-gray-500 mb-3">Returning users signal content stickiness and brand loyalty. A growing returning share is one of the strongest organic growth indicators.</p>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <!-- KPI card -->
          <div class="bg-white shadow-sm rounded-lg p-5 flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-semibold text-gray-700 mb-4">Period Summary</h3>
              <div class="space-y-4">
                <div>
                  <div class="text-3xl font-bold text-emerald-600 tabular-nums">{{ returningRatePct.toFixed(1) }}%</div>
                  <div class="text-xs text-gray-400 mt-0.5">Returning user rate</div>
                </div>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">New users</span>
                    <span class="font-medium text-blue-600">{{ overview.totals.newUsers.toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Returning users</span>
                    <span class="font-medium text-emerald-600">{{ returningUsersTotal.toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Total users</span>
                    <span class="font-medium text-gray-700">{{ overview.totals.users.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div class="flex h-4 rounded-full overflow-hidden">
                <div class="bg-blue-400 transition-all" :style="{ width: `${100 - returningRatePct}%` }"></div>
                <div class="bg-emerald-400 transition-all" :style="{ width: `${returningRatePct}%` }"></div>
              </div>
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>New {{ (100 - returningRatePct).toFixed(0) }}%</span>
                <span>Returning {{ returningRatePct.toFixed(0) }}%</span>
              </div>
            </div>
          </div>

          <!-- Donut -->
          <div class="bg-white shadow-sm rounded-lg p-5 flex flex-col items-center justify-center">
            <h3 class="text-sm font-semibold text-gray-700 mb-4 self-start">User Type Breakdown</h3>
            <div class="h-48 w-48">
              <ClientOnly>
                <SearchDonutChart :segments="newReturningSegments" />
              </ClientOnly>
            </div>
            <div class="flex gap-5 mt-3 text-xs text-gray-500">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>New</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Returning</span>
            </div>
          </div>

          <!-- Trend -->
          <div class="bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Returning Rate Over Time</h3>
            <div style="height: 160px">
              <ClientOnly>
                <Ga4LineChart
                  :labels="dailyLabels"
                  :datasets="[{ label: 'Returning %', values: returningRateTrend, color: '#10b981', fillColor: 'rgba(16,185,129,0.07)' }]"
                  suffix="%"
                />
              </ClientOnly>
            </div>
          </div>
        </div>
      </section>

      <!-- ── A5 Day-of-Week Heatmap ───────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">Day-of-Week Traffic Heatmap</h2>
        <p class="text-xs text-gray-500 mb-3">Reveals when your audience is most active — useful for content publishing timing, ad scheduling, and understanding weekday vs weekend patterns.</p>
        <div class="bg-white shadow-sm rounded-lg p-5">
          <div class="grid grid-cols-7 gap-2 mb-2">
            <div v-for="d in dayNames" :key="d" class="text-center text-xs font-medium text-gray-500">{{ d }}</div>
          </div>
          <div class="grid grid-cols-7 gap-2 mb-4">
            <div v-for="day in dayStats" :key="day.day"
              class="rounded-lg p-3 text-center transition-all"
              :style="{ backgroundColor: dayHeatColor(day.avg, maxDayAvg) }">
              <div class="text-sm font-bold text-gray-800">{{ day.avg.toFixed(0) }}</div>
              <div class="text-xs text-gray-500 mt-0.5">avg/day</div>
            </div>
          </div>
          <p class="text-xs text-gray-400 text-center">
            Based on {{ overview.dailyTotals.length }} days of data, averaged per day of week.
            Busiest: <strong>{{ dayNames[busiestDay] }}</strong> ({{ dayStats[busiestDay]?.avg.toFixed(0) }} avg sessions)
          </p>
        </div>
      </section>

    </template>

    <div v-else-if="loading" class="text-center py-16 text-gray-400 text-sm">Loading…</div>
    <div v-else-if="!selectedPropertyId" class="text-center py-16 text-gray-400 text-sm">Select a property above.</div>
    <div v-else class="text-center py-16 text-gray-400 text-sm">No audience data. Pull GA4 data from the <NuxtLink to="/import" class="text-indigo-600 underline">Import</NuxtLink> page.</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Property { _id: string; propertyName: string }
interface DailyTotal {
  date: string; sessions: number; users: number; screenPageViews: number
  newUsers: number; bounceRate: number; engagementRate: number; avgSessionDurationSec: number
}
interface OverviewData {
  dailyTotals: DailyTotal[]
  channelTotals: any[]
  totals: { sessions: number; users: number; pageViews: number; newUsers: number; bounceRate: number; engagementRate: number; avgSessionDurationSec: number }
}
interface DeviceMetric { deviceCategory: string; sessions: number; users: number; screenPageViews: number }

const DEVICE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#94a3b8']

const ranges = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const range = ref('30d')
const loading = ref(false)
const error = ref('')
const overview = ref<OverviewData | null>(null)
const devices = ref<DeviceMetric[]>([])

// ── A1 Device split ────────────────────────────────────────────────────────
const totalDeviceSessions = computed(() => devices.value.reduce((s, d) => s + d.sessions, 0))
const totalDeviceViews = computed(() => devices.value.reduce((s, d) => s + d.screenPageViews, 0))

const deviceCards = computed(() =>
  devices.value.map((d, i) => ({
    device: d.deviceCategory,
    sessions: d.sessions,
    users: d.users,
    views: d.screenPageViews,
    sessionPct: totalDeviceSessions.value > 0 ? (d.sessions / totalDeviceSessions.value) * 100 : 0,
    viewPct: totalDeviceViews.value > 0 ? (d.screenPageViews / totalDeviceViews.value) * 100 : 0,
  }))
)

const deviceDonutSessions = computed(() =>
  devices.value.map((d, i) => ({
    label: d.deviceCategory,
    value: d.sessions,
    color: DEVICE_COLORS[i % DEVICE_COLORS.length],
  }))
)
const deviceDonutViews = computed(() =>
  devices.value.map((d, i) => ({
    label: d.deviceCategory,
    value: d.screenPageViews,
    color: DEVICE_COLORS[i % DEVICE_COLORS.length],
  }))
)

// ── A2 + D1 New vs Returning ───────────────────────────────────────────────
const returningUsersTotal = computed(() => {
  const t = overview.value?.totals
  if (!t) return 0
  return Math.max(0, t.users - t.newUsers)
})
const returningRatePct = computed(() => {
  const t = overview.value?.totals
  if (!t || !t.users) return 0
  return (returningUsersTotal.value / t.users) * 100
})
const newReturningSegments = computed(() => [
  { label: 'New', value: overview.value?.totals.newUsers ?? 0, color: '#60a5fa' },
  { label: 'Returning', value: returningUsersTotal.value, color: '#10b981' },
])

const dailyLabels = computed(() =>
  (overview.value?.dailyTotals ?? []).map(d => {
    const [, m, day] = d.date.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[parseInt(m) - 1]} ${parseInt(day)}`
  })
)
const returningRateTrend = computed(() =>
  (overview.value?.dailyTotals ?? []).map(d => {
    if (!d.users) return 0
    const returning = Math.max(0, d.users - d.newUsers)
    return parseFloat(((returning / d.users) * 100).toFixed(1))
  })
)

// ── A5 Day-of-week heatmap ─────────────────────────────────────────────────
const dayStats = computed(() => {
  const totals = [0, 0, 0, 0, 0, 0, 0]
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const d of overview.value?.dailyTotals ?? []) {
    const dow = new Date(d.date + 'T00:00:00').getDay()
    totals[dow] += d.sessions
    counts[dow]++
  }
  return dayNames.map((_, i) => ({
    day: i,
    avg: counts[i] > 0 ? totals[i] / counts[i] : 0,
  }))
})
const maxDayAvg = computed(() => Math.max(...dayStats.value.map(d => d.avg), 1))
const busiestDay = computed(() => dayStats.value.reduce((best, d) => d.avg > dayStats.value[best].avg ? d.day : best, 0))

function dayHeatColor(avg: number, max: number): string {
  if (!max) return '#f9fafb'
  const intensity = avg / max
  if (intensity >= 0.8) return 'rgba(79, 70, 229, 0.85)'
  if (intensity >= 0.6) return 'rgba(99, 102, 241, 0.65)'
  if (intensity >= 0.4) return 'rgba(129, 140, 248, 0.45)'
  if (intensity >= 0.2) return 'rgba(165, 180, 252, 0.35)'
  return 'rgba(224, 231, 255, 0.5)'
}

watch([selectedPropertyId, range], () => { if (selectedPropertyId.value) load() })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const pid = selectedPropertyId.value
    const r = range.value
    const [ov, dv] = await Promise.all([
      $fetch<{ data: OverviewData }>(`/api/ga4/overview?propertyId=${pid}&range=${r}`),
      $fetch<{ data: DeviceMetric[] }>(`/api/ga4/device-metrics?propertyId=${pid}&range=${r}`),
    ])
    overview.value = ov.data
    devices.value = dv.data
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

onMounted(loadProperties)
</script>
