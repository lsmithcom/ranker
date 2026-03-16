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

    <template v-if="sources.length">

      <!-- ── A6 Channel Stacked Area ──────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">Channel Mix Over Time</h2>
        <p class="text-xs text-gray-500 mb-3">Sessions per channel stacked daily — total height = total sessions. Reveals seasonal patterns and channel mix shifts over time.</p>
        <div class="bg-white shadow-sm rounded-lg p-4">
          <div v-if="!channelTrend || !channelTrend.dates.length" class="py-8 text-center text-sm text-gray-400">
            No channel trend data — run a GA4 pull to populate channel groups.
          </div>
          <template v-else>
            <div class="flex flex-wrap gap-2 mb-3">
              <span v-for="(s, i) in channelTrendSeries" :key="s.channel"
                class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                :style="{ backgroundColor: CHANNEL_BG_COLORS[i % CHANNEL_BG_COLORS.length], color: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }">
                {{ s.channel }}
                <span class="opacity-70">{{ s.values.reduce((a, b) => a + b, 0).toLocaleString() }}</span>
              </span>
            </div>
            <div style="height: 320px">
              <ClientOnly>
                <AnalyticsStackedArea :labels="channelTrend.dates" :series="channelTrendSeries" />
              </ClientOnly>
            </div>
          </template>
        </div>
      </section>

      <!-- ── D4 Organic Search Share ──────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">Organic Search Share Trend</h2>
        <p class="text-xs text-gray-500 mb-3">Is SEO investment growing your organic share of traffic? A rising organic % is a key indicator that content and rankings work is paying off.</p>
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div class="bg-white shadow-sm rounded-lg p-5 flex flex-col justify-center">
            <div class="text-4xl font-bold tabular-nums mb-1"
              :class="organicAvgPct >= 30 ? 'text-green-600' : organicAvgPct >= 15 ? 'text-amber-600' : 'text-red-500'">
              {{ organicAvgPct.toFixed(1) }}%
            </div>
            <div class="text-xs text-gray-400 mb-3">Average organic share</div>
            <div class="space-y-1 text-xs text-gray-600">
              <div>{{ organicTotalSessions.toLocaleString() }} organic sessions</div>
              <div>{{ organicTotalAll.toLocaleString() }} total sessions</div>
            </div>
          </div>
          <div class="lg:col-span-3 bg-white shadow-sm rounded-lg p-4">
            <div v-if="!organicTrend.length" class="h-full flex items-center justify-center text-sm text-gray-400 py-8">
              No organic trend data available.
            </div>
            <div v-else style="height: 160px">
              <ClientOnly>
                <Ga4LineChart
                  :labels="organicTrend.map(d => formatLabel(d.date))"
                  :datasets="[{ label: 'Organic %', values: organicTrend.map(d => d.organicPct), color: '#22c55e', fillColor: 'rgba(34,197,94,0.07)' }]"
                  suffix="%"
                />
              </ClientOnly>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Summary Cards ────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="bg-white shadow-sm rounded p-3 text-center">
          <div class="text-lg font-semibold text-gray-800">{{ totalSessions.toLocaleString() }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Total Sessions</div>
        </div>
        <div class="bg-white shadow-sm rounded p-3 text-center">
          <div class="text-lg font-semibold text-gray-800">{{ totalUsers.toLocaleString() }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Total Users</div>
        </div>
        <div class="bg-white shadow-sm rounded p-3 text-center">
          <div class="text-lg font-semibold text-gray-800">{{ channelGroups.length }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Channel Groups</div>
        </div>
        <div class="bg-white shadow-sm rounded p-3 text-center">
          <div class="text-lg font-semibold text-gray-800">{{ sources.length }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Source / Medium Combos</div>
        </div>
      </div>

      <!-- ── B1 Clean Channel Groups ──────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">Sessions by Channel Group</h2>
        <p class="text-xs text-gray-500 mb-3">GA4's built-in channel grouping — far more readable than raw source/medium strings.</p>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white shadow-sm rounded-lg p-5">
            <div class="space-y-3.5">
              <div v-for="(ch, i) in channelGroups" :key="ch.channel">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }"></span>
                    <span class="text-sm text-gray-700">{{ ch.channel }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-xs text-gray-400">{{ ch.sessions.toLocaleString() }}</span>
                    <span class="text-xs font-medium text-gray-600 w-9 text-right">{{ pct(ch.sessions, totalSessions) }}%</span>
                  </div>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500"
                    :style="{ width: pct(ch.sessions, totalSessions) + '%', backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }">
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-white shadow-sm rounded-lg overflow-hidden">
            <table class="w-full text-xs">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-500">Channel</th>
                  <th class="px-3 py-2.5 text-right font-medium text-gray-500">Sessions</th>
                  <th class="px-3 py-2.5 text-right font-medium text-gray-500">New Users</th>
                  <th class="px-3 py-2.5 text-right font-medium text-gray-500">Engagement</th>
                  <th class="px-3 py-2.5 text-right font-medium text-gray-500">Bounce</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="ch in channelGroups" :key="ch.channel" class="hover:bg-gray-50">
                  <td class="px-3 py-2 font-medium text-gray-700">{{ ch.channel }}</td>
                  <td class="px-3 py-2 text-right text-gray-700">{{ ch.sessions.toLocaleString() }}</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ ch.newUsers.toLocaleString() }}</td>
                  <td class="px-3 py-2 text-right font-medium" :class="ch.engagementRate >= 0.6 ? 'text-green-600' : ch.engagementRate >= 0.35 ? 'text-amber-600' : 'text-red-500'">
                    {{ (ch.engagementRate * 100).toFixed(1) }}%
                  </td>
                  <td class="px-3 py-2 text-right font-medium" :class="ch.bounceRate >= 0.7 ? 'text-red-600' : ch.bounceRate >= 0.5 ? 'text-amber-600' : 'text-green-600'">
                    {{ (ch.bounceRate * 100).toFixed(1) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ── A3 Channel Quality Comparison ───────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">Channel Quality Comparison</h2>
        <p class="text-xs text-gray-500 mb-3">Volume vs quality — which channels bring engaged visitors vs. just raw traffic? Engagement % (green) vs Bounce % (red) per channel.</p>
        <div class="bg-white shadow-sm rounded-lg p-4">
          <div style="height: 280px">
            <ClientOnly>
              <AnalyticsGroupedBar
                :labels="channelGroups.map(c => c.channel)"
                :datasets="channelQualityDatasets"
                suffix="%"
                :horizontal="true"
              />
            </ClientOnly>
          </div>
        </div>
      </section>

      <!-- ── Source / Medium Table ────────────────────────────────────────── -->
      <section class="mb-6">
        <div class="bg-white shadow-sm rounded overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-700">Source / Medium Breakdown</h2>
            <div class="flex gap-2">
              <button v-for="col in sortableCols" :key="col.field" @click="sortField = col.field"
                class="text-xs px-2 py-1 rounded transition-colors"
                :class="sortField === col.field ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
                {{ col.label }}
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Medium</th>
                  <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Sessions</th>
                  <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Users</th>
                  <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">New Users</th>
                  <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Bounce</th>
                  <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Engagement</th>
                  <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">% of Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in sortedSources" :key="`${row.source}/${row.medium}`" class="hover:bg-gray-50">
                  <td class="px-4 py-2 text-gray-700">{{ row.source }}</td>
                  <td class="px-4 py-2">
                    <span class="text-xs px-1.5 py-0.5 rounded font-medium"
                      :style="{ backgroundColor: channelColor(row.medium) + '22', color: channelColor(row.medium) }">
                      {{ row.medium }}
                    </span>
                  </td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ row.sessions.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ row.users.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ row.newUsers.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right" :class="row.bounceRate * 100 >= 70 ? 'text-red-600' : row.bounceRate * 100 >= 50 ? 'text-amber-600' : 'text-green-600'">
                    {{ (row.bounceRate * 100).toFixed(1) }}%
                  </td>
                  <td class="px-4 py-2 text-right" :class="row.engagementRate * 100 >= 60 ? 'text-green-600' : row.engagementRate * 100 >= 40 ? 'text-amber-600' : 'text-red-600'">
                    {{ (row.engagementRate * 100).toFixed(1) }}%
                  </td>
                  <td class="px-4 py-2 text-right text-gray-500">{{ pct(row.sessions, totalSessions) }}%</td>
                </tr>
                <tr v-if="!sortedSources.length">
                  <td colspan="8" class="px-4 py-8 text-center text-gray-400">No data.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ── Top Countries ────────────────────────────────────────────────── -->
      <section>
        <div class="bg-white shadow-sm rounded overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Top Countries</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Country</th>
                  <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Sessions</th>
                  <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Users</th>
                  <th class="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Share</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in geo" :key="row.country" class="hover:bg-gray-50">
                  <td class="px-4 py-2 text-gray-700">{{ row.country }}</td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ row.sessions.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ row.users.toLocaleString() }}</td>
                  <td class="px-4 py-2">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-400 rounded-full" :style="{ width: pct(row.sessions, geoTotal) + '%' }"></div>
                      </div>
                      <span class="text-xs text-gray-400 w-8">{{ pct(row.sessions, geoTotal) }}%</span>
                    </div>
                  </td>
                </tr>
                <tr v-if="!geo.length">
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400">No data.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </template>

    <div v-else-if="loading" class="text-center py-16 text-gray-400 text-sm">Loading…</div>
    <div v-else-if="!selectedPropertyId" class="text-center py-16 text-gray-400 text-sm">Select a property above.</div>
    <div v-else class="text-center py-16 text-gray-400 text-sm">No data for this range.</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Property { _id: string; propertyName: string }
interface TrafficSource {
  source: string
  medium: string
  sessions: number
  users: number
  newUsers: number
  bounceRate: number
  engagementRate: number
  conversions: number
  channelGroup: string
}
interface GeoMetric { country: string; sessions: number; users: number }
interface ChannelTrend { dates: string[]; series: Array<{ channel: string; values: number[] }> }
interface OrganicPoint { date: string; totalSessions: number; organicSessions: number; organicPct: number }

const CHANNEL_COLORS = [
  '#22c55e', '#3b82f6', '#a855f7', '#ec4899',
  '#f97316', '#eab308', '#14b8a6', '#ef4444', '#94a3b8',
]
const CHANNEL_BG_COLORS = CHANNEL_COLORS.map(c => c + '18')

const ranges = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]
const sortableCols = [
  { label: 'Sessions', field: 'sessions' },
  { label: 'Users', field: 'users' },
  { label: 'New Users', field: 'newUsers' },
]

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const range = ref('30d')
const sortField = ref('sessions')
const loading = ref(false)
const error = ref('')
const sources = ref<TrafficSource[]>([])
const geo = ref<GeoMetric[]>([])
const channelTrend = ref<ChannelTrend | null>(null)
const organicTrend = ref<OrganicPoint[]>([])

function mediumToChannel(medium: string): string {
  const m = (medium || '').toLowerCase()
  if (m === 'organic') return 'Organic Search'
  if (m === 'cpc' || m === 'ppc' || m === 'paid') return 'Paid Search'
  if (m === 'email') return 'Email'
  if (m === 'social' || m === 'social-network') return 'Organic Social'
  if (m === 'referral') return 'Referral'
  if (m === '(none)' || m === 'none' || !m) return 'Direct'
  return 'Other'
}

const MEDIUM_COLORS: Record<string, string> = {
  organic: '#22c55e', cpc: '#f97316', referral: '#a855f7',
  email: '#0ea5e9', social: '#ec4899', '(none)': '#6b7280',
}
function channelColor(medium: string): string {
  return MEDIUM_COLORS[medium.toLowerCase()] ?? '#94a3b8'
}

interface ChannelGroup {
  channel: string; sessions: number; users: number; newUsers: number; bounceRate: number; engagementRate: number
}

const channelGroups = computed<ChannelGroup[]>(() => {
  const map = new Map<string, { sessions: number; users: number; newUsers: number; bounceSum: number; engageSum: number; count: number }>()
  for (const s of sources.value) {
    const ch = (s.channelGroup && s.channelGroup !== '(Other)') ? s.channelGroup : mediumToChannel(s.medium)
    const ex = map.get(ch)
    if (ex) {
      ex.sessions += s.sessions; ex.users += s.users; ex.newUsers += s.newUsers
      ex.bounceSum += s.bounceRate * s.sessions; ex.engageSum += s.engagementRate * s.sessions; ex.count += s.sessions
    } else {
      map.set(ch, { sessions: s.sessions, users: s.users, newUsers: s.newUsers,
        bounceSum: s.bounceRate * s.sessions, engageSum: s.engagementRate * s.sessions, count: s.sessions })
    }
  }
  return [...map.entries()]
    .map(([channel, v]) => ({
      channel, sessions: v.sessions, users: v.users, newUsers: v.newUsers,
      bounceRate: v.count > 0 ? v.bounceSum / v.count : 0,
      engagementRate: v.count > 0 ? v.engageSum / v.count : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)
})

const totalSessions = computed(() => channelGroups.value.reduce((s, c) => s + c.sessions, 0))
const totalUsers = computed(() => channelGroups.value.reduce((s, c) => s + c.users, 0))
const geoTotal = computed(() => geo.value.reduce((s, g) => s + g.sessions, 0))

const channelQualityDatasets = computed(() => [
  { label: 'Engagement Rate', values: channelGroups.value.map(c => parseFloat((c.engagementRate * 100).toFixed(1))), color: 'rgba(34,197,94,0.75)' },
  { label: 'Bounce Rate', values: channelGroups.value.map(c => parseFloat((c.bounceRate * 100).toFixed(1))), color: 'rgba(239,68,68,0.65)' },
])

const channelTrendSeries = computed(() => {
  if (!channelTrend.value) return []
  return channelTrend.value.series.map((s, i) => ({
    channel: s.channel,
    values: s.values,
    color: CHANNEL_COLORS[i % CHANNEL_COLORS.length] + 'b3',
  }))
})

const organicAvgPct = computed(() => {
  if (!organicTrend.value.length) return 0
  return organicTrend.value.reduce((s, d) => s + d.organicPct, 0) / organicTrend.value.length
})
const organicTotalSessions = computed(() => organicTrend.value.reduce((s, d) => s + d.organicSessions, 0))
const organicTotalAll = computed(() => organicTrend.value.reduce((s, d) => s + d.totalSessions, 0))

const sortedSources = computed(() =>
  [...sources.value].sort((a, b) => (b[sortField.value as keyof TrafficSource] as number) - (a[sortField.value as keyof TrafficSource] as number))
)

watch([selectedPropertyId, range], () => { if (selectedPropertyId.value) load() })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const pid = selectedPropertyId.value
    const r = range.value
    const [sr, ge, ct, ot] = await Promise.all([
      $fetch<{ data: TrafficSource[] }>(`/api/ga4/traffic-sources?propertyId=${pid}&range=${r}`),
      $fetch<{ data: GeoMetric[] }>(`/api/ga4/geo-metrics?propertyId=${pid}&range=${r}`),
      $fetch<any>(`/api/ga4/channel-trend?propertyId=${pid}&range=${r}`),
      $fetch<{ data: OrganicPoint[] }>(`/api/ga4/organic-trend?propertyId=${pid}&range=${r}`),
    ])
    sources.value = sr.data
    geo.value = ge.data
    channelTrend.value = ct?.dates?.length ? ct : null
    organicTrend.value = ot?.data ?? []
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

function pct(n: number, total: number): string {
  if (!total) return '0'
  return ((n / total) * 100).toFixed(1)
}

function formatLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(m) - 1]} ${parseInt(d)}`
}

onMounted(loadProperties)
</script>
