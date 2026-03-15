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

      <span v-if="loading" class="text-sm text-gray-400">Loading…</span>
      <span v-if="error" class="text-sm text-red-600">{{ error }}</span>
    </div>

    <template v-if="sources.length || channels.length">

      <!-- ── Channel Breakdown ──────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        <!-- Channel bars -->
        <div class="bg-white shadow-sm rounded p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Sessions by Channel</h2>
          <div class="space-y-3">
            <div v-for="ch in channels" :key="ch.medium">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-gray-700 capitalize">{{ ch.medium === '(none)' ? 'direct' : ch.medium }}</span>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-400">{{ ch.sessions.toLocaleString() }} sessions</span>
                  <span class="text-xs font-medium text-gray-600 w-10 text-right">{{ pct(ch.sessions, totalSessions) }}%</span>
                </div>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{ width: pct(ch.sessions, totalSessions) + '%', backgroundColor: channelColor(ch.medium) }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Channel chart -->
        <div class="bg-white shadow-sm rounded p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-1">Users by Channel</h2>
          <div class="space-y-3 mt-4">
            <div v-for="ch in channels" :key="ch.medium">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-gray-700 capitalize">{{ ch.medium === '(none)' ? 'direct' : ch.medium }}</span>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-400">{{ ch.users.toLocaleString() }} users</span>
                  <span class="text-xs font-medium text-gray-600 w-10 text-right">{{ pct(ch.users, totalUsers) }}%</span>
                </div>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{ width: pct(ch.users, totalUsers) + '%', backgroundColor: channelColor(ch.medium) }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Summary Stat Cards ─────────────────────────────────────────────── -->
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
          <div class="text-lg font-semibold text-gray-800">{{ sources.length }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Source / Medium Combos</div>
        </div>
        <div class="bg-white shadow-sm rounded p-3 text-center">
          <div class="text-lg font-semibold text-gray-800">{{ channels.length }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Channels</div>
        </div>
      </div>

      <!-- ── Source / Medium Table ───────────────────────────────────────────── -->
      <div class="bg-white shadow-sm rounded overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">Source / Medium Breakdown</h2>
          <div class="flex gap-2">
            <button
              v-for="col in sortableCols"
              :key="col.field"
              @click="sortField = col.field"
              class="text-xs px-2 py-1 rounded transition-colors"
              :class="sortField === col.field ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
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
                <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Bounce Rate</th>
                <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Engagement</th>
                <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">% of Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in sortedSources" :key="`${row.source}/${row.medium}`" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-700">{{ row.source }}</td>
                <td class="px-4 py-2">
                  <span
                    class="text-xs px-1.5 py-0.5 rounded font-medium"
                    :style="{ backgroundColor: channelColor(row.medium) + '22', color: channelColor(row.medium) }"
                  >
                    {{ row.medium }}
                  </span>
                </td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.sessions.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.users.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-gray-800">{{ row.newUsers.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right" :class="bounceColor(row.bounceRate)">
                  {{ (row.bounceRate * 100).toFixed(1) }}%
                </td>
                <td class="px-4 py-2 text-right" :class="engageColor(row.engagementRate)">
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

      <!-- ── Countries Table ────────────────────────────────────────────────── -->
      <div class="mt-4 bg-white shadow-sm rounded overflow-hidden">
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
                      <div
                        class="h-full bg-blue-400 rounded-full"
                        :style="{ width: pct(row.sessions, geo[0]?.sessions ?? 1) + '%' }"
                      ></div>
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

    </template>

    <div v-else-if="!loading && selectedPropertyId" class="text-sm text-gray-500 mt-8 text-center">
      No data for this range.
    </div>
    <div v-else-if="!selectedPropertyId" class="text-sm text-gray-500 mt-8 text-center">
      Select a property above.
    </div>
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
}
interface ChannelTotal { medium: string; sessions: number; users: number }
interface GeoMetric { country: string; sessions: number; users: number }

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

// Derive channel totals from sources
const channels = computed<ChannelTotal[]>(() => {
  const map = new Map<string, ChannelTotal>()
  for (const s of sources.value) {
    const existing = map.get(s.medium)
    if (existing) {
      existing.sessions += s.sessions
      existing.users += s.users
    } else {
      map.set(s.medium, { medium: s.medium, sessions: s.sessions, users: s.users })
    }
  }
  return [...map.values()].sort((a, b) => b.sessions - a.sessions)
})

const totalSessions = computed(() => channels.value.reduce((s, c) => s + c.sessions, 0))
const totalUsers = computed(() => channels.value.reduce((s, c) => s + c.users, 0))
const geoTotal = computed(() => geo.value.reduce((s, g) => s + g.sessions, 0))

const sortedSources = computed(() =>
  [...sources.value].sort(
    (a, b) => (b[sortField.value as keyof TrafficSource] as number) - (a[sortField.value as keyof TrafficSource] as number)
  )
)

const CHANNEL_COLORS: Record<string, string> = {
  organic: '#10b981',
  cpc: '#f59e0b',
  referral: '#6366f1',
  email: '#0ea5e9',
  social: '#ec4899',
  '(none)': '#6b7280',
  direct: '#6b7280',
}

function channelColor(medium: string): string {
  return CHANNEL_COLORS[medium.toLowerCase()] ?? '#94a3b8'
}

watch([selectedPropertyId, range], () => { if (selectedPropertyId.value) load() })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [sr, ge] = await Promise.all([
      $fetch<{ data: TrafficSource[] }>(`/api/ga4/traffic-sources?propertyId=${selectedPropertyId.value}&range=${range.value}`),
      $fetch<{ data: GeoMetric[] }>(`/api/ga4/geo-metrics?propertyId=${selectedPropertyId.value}&range=${range.value}`),
    ])
    sources.value = sr.data
    geo.value = ge.data
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
