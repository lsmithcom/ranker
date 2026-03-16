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

    <template v-if="loaded">

      <!-- Fresh pull notice -->
      <div v-if="needsPull" class="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded px-4 py-3 mb-6">
        Conversion data requires a fresh GA4 pull. Go to the
        <NuxtLink to="/import" class="underline">Import</NuxtLink>
        page and pull the latest data to populate these metrics.
      </div>

      <!-- No conversions notice -->
      <div v-if="!needsPull && totalConversions === 0" class="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded px-4 py-3 mb-6">
        No conversion events found for this period. Configure <strong>Key Events</strong> in your GA4 property
        (Admin → Events → Mark as Key Event) to track form submissions, purchases, sign-ups, or other goals.
      </div>

      <!-- ── KPI Cards ────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="bg-white shadow-sm rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-indigo-700">{{ totalConversions.toLocaleString() }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Total Conversions</div>
        </div>
        <div class="bg-white shadow-sm rounded-lg p-4 text-center">
          <div class="text-2xl font-bold" :class="overallConvRate >= 3 ? 'text-green-600' : overallConvRate >= 1 ? 'text-amber-600' : 'text-gray-600'">
            {{ overallConvRate.toFixed(2) }}%
          </div>
          <div class="text-xs text-gray-400 mt-0.5">Overall Conv. Rate</div>
        </div>
        <div class="bg-white shadow-sm rounded-lg p-4 text-center">
          <div class="text-sm font-semibold text-gray-800 truncate" :title="topConvPage">{{ topConvPage || '—' }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Top Converting Page</div>
        </div>
        <div class="bg-white shadow-sm rounded-lg p-4 text-center">
          <div class="text-sm font-semibold text-gray-800">{{ topConvChannel || '—' }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Top Converting Channel</div>
        </div>
      </div>

      <!-- ── C1 Conversions per Page ──────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">Conversions by Page</h2>
        <p class="text-xs text-gray-500 mb-3">Which pages drive the most conversions? Conversion rate = conversions ÷ sessions per page.</p>
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <div v-if="!convPageData.length" class="p-10 text-center">
            <div class="text-5xl text-gray-200 mb-3">🎯</div>
            <p class="text-sm font-medium text-gray-600 mb-1">No conversion data found</p>
            <p class="text-xs text-gray-400 max-w-sm mx-auto">
              Mark events as Key Events in GA4 (Admin → Events → toggle "Mark as key event"),
              then run a fresh pull on the <NuxtLink to="/import" class="text-indigo-600 underline">Import</NuxtLink> page.
            </p>
          </div>
          <template v-else>
            <table class="w-full text-xs">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-4 py-2.5 text-left font-medium text-gray-500 uppercase">Page</th>
                  <th class="px-4 py-2.5 text-right font-medium text-gray-500 uppercase">Sessions</th>
                  <th class="px-4 py-2.5 text-right font-medium text-gray-500 uppercase">Conversions</th>
                  <th class="px-4 py-2.5 text-right font-medium text-gray-500 uppercase">Conv Rate</th>
                  <th class="px-4 py-2.5 w-28 font-medium text-gray-500 uppercase">Rate Bar</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="p in convPageData" :key="p.pagePath" class="hover:bg-gray-50">
                  <td class="px-4 py-2 font-mono text-gray-600 truncate max-w-xs" :title="p.pagePath">{{ p.pagePath }}</td>
                  <td class="px-4 py-2 text-right text-gray-700">{{ p.sessions.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right font-semibold text-indigo-700">{{ p.conversions.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right font-medium"
                    :class="p.convRate >= 3 ? 'text-green-600' : p.convRate >= 1 ? 'text-amber-600' : 'text-gray-500'">
                    {{ p.convRate.toFixed(2) }}%
                  </td>
                  <td class="px-4 py-2">
                    <div class="bg-gray-100 rounded-full overflow-hidden h-2">
                      <div class="h-full bg-indigo-500 rounded-full"
                        :style="{ width: `${Math.min((p.convRate / maxPageConvRate) * 100, 100)}%` }"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>
      </section>

      <!-- ── C2 Conversions per Channel ───────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">Conversions by Channel</h2>
        <p class="text-xs text-gray-500 mb-3">Which traffic channels drive the most conversions? Helps prioritise acquisition investment — a channel with low volume but high conversion rate is often underinvested.</p>
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <div v-if="!convChannelData.length" class="p-10 text-center">
            <div class="text-5xl text-gray-200 mb-3">📊</div>
            <p class="text-sm text-gray-500">No conversion data by channel — configure Key Events in GA4 first.</p>
          </div>
          <template v-else>
            <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <!-- Bar chart -->
              <div class="p-5">
                <p class="text-xs font-medium text-gray-500 mb-4">Conversions by channel</p>
                <div class="space-y-3">
                  <div v-for="(ch, i) in convChannelData" :key="ch.channel" class="flex items-center gap-3 text-xs">
                    <span class="text-gray-600 w-28 truncate" :title="ch.channel">{{ ch.channel }}</span>
                    <div class="flex-1 bg-gray-100 rounded-full overflow-hidden h-6 relative">
                      <div class="h-full rounded-full flex items-center px-2 text-white font-medium text-xs transition-all"
                        :style="{ width: `${Math.max(ch.pct, 5)}%`, backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }">
                        {{ ch.conversions.toLocaleString() }}
                      </div>
                    </div>
                    <span class="text-gray-400 w-8 text-right">{{ ch.pct.toFixed(0) }}%</span>
                  </div>
                </div>
              </div>
              <!-- Table -->
              <div class="p-5">
                <p class="text-xs font-medium text-gray-500 mb-4">Conversion rate by channel</p>
                <table class="w-full text-xs">
                  <thead>
                    <tr class="text-left text-gray-400 border-b border-gray-100">
                      <th class="pb-2 font-medium">Channel</th>
                      <th class="pb-2 text-right font-medium">Sessions</th>
                      <th class="pb-2 text-right font-medium">Conv.</th>
                      <th class="pb-2 text-right font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    <tr v-for="ch in convChannelData" :key="ch.channel" class="hover:bg-gray-50">
                      <td class="py-2 text-gray-700 truncate max-w-28" :title="ch.channel">{{ ch.channel }}</td>
                      <td class="py-2 text-right text-gray-600">{{ ch.sessions.toLocaleString() }}</td>
                      <td class="py-2 text-right font-semibold text-indigo-700">{{ ch.conversions.toLocaleString() }}</td>
                      <td class="py-2 text-right font-medium"
                        :class="ch.convRate >= 3 ? 'text-green-600' : ch.convRate >= 1 ? 'text-amber-600' : 'text-gray-500'">
                        {{ ch.convRate.toFixed(2) }}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- ── C3 Revenue / E-commerce ──────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">Revenue &amp; E-commerce</h2>
        <p class="text-xs text-gray-500 mb-3">Requires GA4 e-commerce tracking (purchase events, revenue values) to be configured on the site.</p>
        <div class="bg-white shadow-sm rounded-lg p-8">
          <div class="max-w-xl mx-auto text-center">
            <div class="text-5xl text-gray-200 mb-4">💰</div>
            <p class="text-sm font-semibold text-gray-700 mb-2">E-commerce tracking not detected</p>
            <p class="text-xs text-gray-400 mb-6 max-w-sm mx-auto">
              No <code class="bg-gray-100 px-1 rounded">purchase</code> or revenue events found for this period.
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 opacity-35 select-none mb-6">
              <div class="border border-gray-200 rounded-lg p-3 text-center">
                <div class="text-lg font-bold text-gray-700">$0</div>
                <div class="text-xs text-gray-400 mt-0.5">Total Revenue</div>
              </div>
              <div class="border border-gray-200 rounded-lg p-3 text-center">
                <div class="text-lg font-bold text-gray-700">0</div>
                <div class="text-xs text-gray-400 mt-0.5">Transactions</div>
              </div>
              <div class="border border-gray-200 rounded-lg p-3 text-center">
                <div class="text-lg font-bold text-gray-700">$0</div>
                <div class="text-xs text-gray-400 mt-0.5">Avg Order Value</div>
              </div>
              <div class="border border-gray-200 rounded-lg p-3 text-center">
                <div class="text-lg font-bold text-gray-700">0%</div>
                <div class="text-xs text-gray-400 mt-0.5">Purchase Rate</div>
              </div>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 text-left">
              <strong>To enable:</strong> Add GA4 e-commerce events (<code>purchase</code>, <code>add_to_cart</code>, <code>view_item</code>)
              via Google Tag Manager or gtag.js. Revenue metrics (<code>totalRevenue</code>, <code>ecommercePurchases</code>)
              will then appear here automatically after the next pull.
            </div>
          </div>
        </div>
      </section>

    </template>

    <div v-else-if="loading" class="text-center py-16 text-gray-400 text-sm">Loading…</div>
    <div v-else-if="!selectedPropertyId" class="text-center py-16 text-gray-400 text-sm">Select a property above.</div>
    <div v-else class="text-center py-16 text-gray-400 text-sm">No data. Pull GA4 data from the <NuxtLink to="/import" class="text-indigo-600 underline">Import</NuxtLink> page.</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Property { _id: string; propertyName: string }
interface PageMetric {
  pagePath: string; sessions: number; conversions: number
  entrances: number; scrolledUsers: number
}
interface TrafficSource {
  source: string; medium: string; sessions: number; conversions: number; channelGroup: string
}

const CHANNEL_COLORS = [
  '#22c55e', '#3b82f6', '#a855f7', '#ec4899',
  '#f97316', '#eab308', '#14b8a6', '#ef4444', '#94a3b8',
]

const ranges = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const range = ref('30d')
const loading = ref(false)
const loaded = ref(false)
const error = ref('')
const pageMetrics = ref<PageMetric[]>([])
const trafficSources = ref<TrafficSource[]>([])

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

// Detect if pull needed (no conversion data at all)
const needsPull = computed(() =>
  pageMetrics.value.length > 0 &&
  pageMetrics.value.every(p => p.entrances === 0 && p.scrolledUsers === 0 && p.conversions === 0)
)

const totalSessions = computed(() => pageMetrics.value.reduce((s, p) => s + p.sessions, 0))
const totalConversions = computed(() => pageMetrics.value.reduce((s, p) => s + p.conversions, 0))
const overallConvRate = computed(() =>
  totalSessions.value > 0 ? (totalConversions.value / totalSessions.value) * 100 : 0
)

// C1: Conversions per page
const convPageData = computed(() =>
  pageMetrics.value
    .filter(p => p.conversions > 0)
    .map(p => ({
      pagePath: p.pagePath,
      sessions: p.sessions,
      conversions: p.conversions,
      convRate: p.sessions > 0 ? (p.conversions / p.sessions) * 100 : 0,
    }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 30)
)
const maxPageConvRate = computed(() =>
  convPageData.value.reduce((m, p) => Math.max(m, p.convRate), 0.001)
)
const topConvPage = computed(() => convPageData.value[0]?.pagePath ?? '')

// C2: Conversions per channel
const convChannelData = computed(() => {
  const map: Record<string, { sessions: number; conversions: number }> = {}
  for (const s of trafficSources.value) {
    const ch = (s.channelGroup && s.channelGroup !== '(Other)') ? s.channelGroup : mediumToChannel(s.medium)
    if (!map[ch]) map[ch] = { sessions: 0, conversions: 0 }
    map[ch].sessions += s.sessions
    map[ch].conversions += s.conversions
  }
  const rows = Object.entries(map)
    .filter(([, v]) => v.conversions > 0)
    .map(([channel, v]) => ({
      channel,
      sessions: v.sessions,
      conversions: v.conversions,
      convRate: v.sessions > 0 ? (v.conversions / v.sessions) * 100 : 0,
      pct: 0,
    }))
    .sort((a, b) => b.conversions - a.conversions)
  if (!rows.length) return []
  const total = rows.reduce((s, r) => s + r.conversions, 0)
  return rows.map(r => ({ ...r, pct: total > 0 ? (r.conversions / total) * 100 : 0 }))
})
const topConvChannel = computed(() => convChannelData.value[0]?.channel ?? '')

watch([selectedPropertyId, range], () => { if (selectedPropertyId.value) load() })

async function load() {
  loading.value = true
  loaded.value = false
  error.value = ''
  try {
    const pid = selectedPropertyId.value
    const r = range.value
    const [pm, ts] = await Promise.all([
      $fetch<{ data: PageMetric[] }>(`/api/ga4/page-metrics?propertyId=${pid}&range=${r}&limit=500`),
      $fetch<{ data: TrafficSource[] }>(`/api/ga4/traffic-sources?propertyId=${pid}&range=${r}`),
    ])
    pageMetrics.value = pm.data
    trafficSources.value = ts.data
    loaded.value = true
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
