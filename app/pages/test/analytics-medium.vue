<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <div class="mb-6">
      <h1 class="text-xl font-semibold text-gray-900 mb-1">Analytics — Medium Effort Explorations</h1>
      <p class="text-sm text-gray-500">Test page for medium-effort visualisation ideas. Items marked <span class="text-amber-600 font-medium">★ New pull needed</span> require running a fresh GA4 pull to populate the latest fields.</p>
    </div>

    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-3 mb-8 p-4 bg-white shadow-sm rounded-lg">
      <select
        v-model="selectedPropertyId"
        class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 min-w-48"
      >
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
    </div>

    <template v-if="selectedPropertyId && !loading">

      <!-- ══════════════════════════════════════════════════════════════
           A4 — PAGE PERFORMANCE SCATTER PLOT
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-3">A4 — Page Performance Matrix: Sessions × Engagement</h2>
        <p class="text-xs text-gray-500 mb-4">Each dot is a page. Position reveals its quadrant: <span class="font-medium text-green-600">Stars</span> (high sessions + high engagement), <span class="font-medium text-blue-600">Underrated</span> (low sessions + high engagement), <span class="font-medium text-orange-500">Risky</span> (high sessions + low engagement), <span class="font-medium text-gray-400">Weak</span> (low sessions + low engagement). Dashed lines = medians.</p>

        <div class="bg-white shadow-sm rounded-lg p-4">
          <!-- Quadrant legend -->
          <div class="flex flex-wrap gap-4 mb-4 text-xs">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span><strong>Stars</strong> — high traffic &amp; engagement → double down</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500 inline-block"></span><strong>Underrated</strong> — great content, low reach → promote</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-orange-500 inline-block"></span><strong>Risky</strong> — high traffic, poor engagement → fix CX</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-gray-400 inline-block"></span><strong>Weak</strong> — low traffic &amp; engagement → deprioritise</span>
          </div>

          <div class="flex gap-4 mb-3 text-xs text-gray-500">
            <span>Showing top {{ scatterPoints.length }} pages by sessions</span>
            <span>Median sessions: <strong>{{ medianX.toLocaleString() }}</strong></span>
            <span>Median engagement: <strong>{{ medianY.toFixed(1) }}%</strong></span>
            <span class="text-green-700 font-medium">Stars: {{ quadrantCounts.star }}</span>
            <span class="text-blue-700 font-medium">Underrated: {{ quadrantCounts.underrated }}</span>
            <span class="text-orange-600 font-medium">Risky: {{ quadrantCounts.risky }}</span>
            <span class="text-gray-500 font-medium">Weak: {{ quadrantCounts.weak }}</span>
          </div>

          <div style="height: 420px">
            <ClientOnly>
              <AnalyticsScatter
                :points="scatterPoints"
                xLabel="Sessions"
                yLabel="Engagement Rate"
                ySuffix="%"
                :medianX="medianX"
                :medianY="medianY"
              />
            </ClientOnly>
          </div>
        </div>

        <!-- Quadrant breakdowns -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <!-- Stars -->
          <div class="bg-white shadow-sm rounded-lg p-4">
            <h3 class="text-sm font-semibold text-green-700 mb-3">Stars — Top 10 by Sessions</h3>
            <div class="space-y-1.5 text-xs">
              <div v-for="p in starPages" :key="p.pagePath" class="flex items-center gap-2">
                <span class="text-gray-500 truncate flex-1" :title="p.pagePath">{{ p.pagePath }}</span>
                <span class="text-gray-700 font-medium w-14 text-right">{{ p.sessions.toLocaleString() }}</span>
                <span class="text-green-600 w-14 text-right">{{ (p.engagementRate * 100).toFixed(0) }}%</span>
              </div>
              <div v-if="!starPages.length" class="text-gray-400 italic">None in this range</div>
            </div>
          </div>
          <!-- Underrated -->
          <div class="bg-white shadow-sm rounded-lg p-4">
            <h3 class="text-sm font-semibold text-blue-700 mb-3">Underrated — Top 10 by Engagement</h3>
            <div class="space-y-1.5 text-xs">
              <div v-for="p in underratedPages" :key="p.pagePath" class="flex items-center gap-2">
                <span class="text-gray-500 truncate flex-1" :title="p.pagePath">{{ p.pagePath }}</span>
                <span class="text-gray-700 font-medium w-14 text-right">{{ p.sessions.toLocaleString() }}</span>
                <span class="text-blue-600 w-14 text-right">{{ (p.engagementRate * 100).toFixed(0) }}%</span>
              </div>
              <div v-if="!underratedPages.length" class="text-gray-400 italic">None in this range</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           A6 — TRAFFIC CHANNEL STACKED AREA CHART
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-3">A6 — Traffic Channels Over Time: Stacked Area</h2>
        <p class="text-xs text-gray-500 mb-4">Sessions per channel stacked day by day. Total height = total sessions. Reveals seasonal patterns and channel mix shifts.</p>

        <div class="bg-white shadow-sm rounded-lg p-4">
          <div v-if="!channelTrend" class="text-sm text-gray-400 py-8 text-center">
            No channel trend data — run a GA4 pull to populate channel groups.
          </div>
          <template v-else>
            <!-- Channel summary pills -->
            <div class="flex flex-wrap gap-2 mb-4">
              <span
                v-for="(s, i) in channelTrendSeries"
                :key="s.channel"
                class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                :style="{ backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length].replace('0.7', '0.12'), color: CHANNEL_COLORS[i % CHANNEL_COLORS.length].replace('0.7', '1') }"
              >
                {{ s.channel }}
                <span class="opacity-70">{{ s.values.reduce((a, b) => a + b, 0).toLocaleString() }}</span>
              </span>
            </div>
            <div style="height: 340px">
              <ClientOnly>
                <AnalyticsStackedArea
                  :labels="channelTrend.dates"
                  :series="channelTrendSeries"
                />
              </ClientOnly>
            </div>
          </template>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           C1 — CONVERSIONS PER PAGE
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-3">C1 — Conversions per Page <span class="text-amber-600 text-sm font-normal">★ New pull needed</span></h2>
        <p class="text-xs text-gray-500 mb-4">Pages ranked by GA4 key event / conversion count. Conversion rate = conversions ÷ sessions. Requires Key Events configured in GA4 and a fresh data pull.</p>

        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <!-- No conversion data state -->
          <div v-if="!conversionPageData.length" class="p-8 text-center">
            <div class="text-gray-300 text-4xl mb-3">🎯</div>
            <p class="text-sm font-medium text-gray-600 mb-1">No conversion data found</p>
            <p class="text-xs text-gray-400 max-w-sm mx-auto">Configure Key Events in your GA4 property (Admin → Events → Mark as Key Event), then run a fresh pull on the Import page.</p>
          </div>
          <template v-else>
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-gray-100 bg-gray-50 text-left text-gray-500">
                  <th class="px-4 py-2.5 font-medium">Page</th>
                  <th class="px-4 py-2.5 font-medium text-right">Sessions</th>
                  <th class="px-4 py-2.5 font-medium text-right">Conversions</th>
                  <th class="px-4 py-2.5 font-medium text-right">Conv Rate</th>
                  <th class="px-4 py-2.5 font-medium w-32">Rate Bar</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="p in conversionPageData" :key="p.pagePath" class="hover:bg-gray-50">
                  <td class="px-4 py-2 font-mono text-gray-600 max-w-xs truncate" :title="p.pagePath">{{ p.pagePath }}</td>
                  <td class="px-4 py-2 text-right text-gray-700">{{ p.sessions.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right font-medium text-indigo-700">{{ p.conversions.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right font-medium" :class="p.convRate >= 3 ? 'text-green-600' : p.convRate >= 1 ? 'text-yellow-600' : 'text-gray-500'">
                    {{ p.convRate.toFixed(2) }}%
                  </td>
                  <td class="px-4 py-2">
                    <div class="bg-gray-100 rounded-full overflow-hidden h-1.5">
                      <div class="h-full bg-indigo-500 rounded-full" :style="{ width: `${Math.min(p.convRate / maxConvRate * 100, 100)}%` }"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           C2 — CONVERSIONS PER CHANNEL
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-3">C2 — Conversions by Channel <span class="text-amber-600 text-sm font-normal">★ New pull needed</span></h2>
        <p class="text-xs text-gray-500 mb-4">Which traffic channels drive the most conversions? Helps identify which acquisition sources translate to actual goals beyond just sessions.</p>

        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <div v-if="!conversionChannelData.length" class="p-8 text-center">
            <div class="text-gray-300 text-4xl mb-3">📊</div>
            <p class="text-sm font-medium text-gray-600 mb-1">No conversion data found</p>
            <p class="text-xs text-gray-400 max-w-sm mx-auto">Configure Key Events in GA4 and run a fresh pull to populate this chart.</p>
          </div>
          <template v-else>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <!-- Horizontal bar chart -->
              <div class="p-4">
                <p class="text-xs font-medium text-gray-500 mb-4">Conversions by channel</p>
                <div class="space-y-3">
                  <div v-for="(ch, i) in conversionChannelData" :key="ch.channel" class="flex items-center gap-3 text-xs">
                    <span class="text-gray-600 w-28 truncate" :title="ch.channel">{{ ch.channel }}</span>
                    <div class="flex-1 bg-gray-100 rounded-full overflow-hidden h-5 relative">
                      <div
                        class="h-full rounded-full flex items-center px-2 text-white font-medium text-xs"
                        :style="{ width: `${Math.max(ch.pct, 6)}%`, backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length].replace('0.7', '0.85') }"
                      >
                        {{ ch.conversions.toLocaleString() }}
                      </div>
                    </div>
                    <span class="text-gray-400 w-10 text-right">{{ ch.pct.toFixed(0) }}%</span>
                  </div>
                </div>
              </div>
              <!-- Table -->
              <div class="p-4">
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
                    <tr v-for="ch in conversionChannelData" :key="ch.channel" class="hover:bg-gray-50">
                      <td class="py-1.5 text-gray-700 truncate max-w-28" :title="ch.channel">{{ ch.channel }}</td>
                      <td class="py-1.5 text-right text-gray-600">{{ ch.sessions.toLocaleString() }}</td>
                      <td class="py-1.5 text-right font-medium text-indigo-700">{{ ch.conversions.toLocaleString() }}</td>
                      <td class="py-1.5 text-right font-medium" :class="ch.convRate >= 3 ? 'text-green-600' : ch.convRate >= 1 ? 'text-yellow-600' : 'text-gray-500'">
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

      <!-- ══════════════════════════════════════════════════════════════
           C3 — REVENUE / E-COMMERCE METRICS (Concept)
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-3">C3 — Revenue &amp; E-commerce Metrics</h2>
        <p class="text-xs text-gray-500 mb-4">Requires GA4 e-commerce tracking (purchase events, revenue) to be configured on the site. Shows total revenue, transactions, AOV, and revenue per channel/page.</p>

        <div class="bg-white shadow-sm rounded-lg p-8">
          <div class="max-w-2xl mx-auto">
            <div class="text-gray-200 text-5xl mb-4 text-center">💰</div>
            <p class="text-sm font-semibold text-gray-700 text-center mb-2">E-commerce tracking not detected</p>
            <p class="text-xs text-gray-400 text-center mb-6">No purchase or revenue events found in your GA4 data for the selected period.</p>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 opacity-40 select-none mb-6">
              <div class="border border-gray-200 rounded-lg p-3 text-center">
                <div class="text-lg font-bold text-gray-700">$0</div>
                <div class="text-xs text-gray-500 mt-0.5">Total Revenue</div>
              </div>
              <div class="border border-gray-200 rounded-lg p-3 text-center">
                <div class="text-lg font-bold text-gray-700">0</div>
                <div class="text-xs text-gray-500 mt-0.5">Transactions</div>
              </div>
              <div class="border border-gray-200 rounded-lg p-3 text-center">
                <div class="text-lg font-bold text-gray-700">$0</div>
                <div class="text-xs text-gray-500 mt-0.5">Avg Order Value</div>
              </div>
              <div class="border border-gray-200 rounded-lg p-3 text-center">
                <div class="text-lg font-bold text-gray-700">0%</div>
                <div class="text-xs text-gray-500 mt-0.5">Purchase Rate</div>
              </div>
            </div>

            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
              <strong>To enable:</strong> Add GA4 e-commerce events (<code>purchase</code>, <code>add_to_cart</code>, <code>view_item</code>) via Google Tag Manager or gtag.js. Then pull metrics for <code>totalRevenue</code>, <code>ecommercePurchases</code>, and <code>itemsViewed</code>. This requires backend model + pull utility updates (Phase 3 scope).
            </div>
          </div>
        </div>
      </section>

    </template>

    <!-- Empty state -->
    <div v-else-if="!selectedPropertyId" class="text-center py-16 text-gray-400 text-sm">
      Select a property above to load analytics data.
    </div>
    <div v-else-if="loading" class="text-center py-16 text-gray-400 text-sm">
      Loading…
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

// ── Types ──────────────────────────────────────────────────────────────────
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
  entrances: number
  exitRate: number
  scrolledUsers: number
  conversions: number
}

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

interface ChannelTrend {
  dates: string[]
  series: Array<{ channel: string; values: number[] }>
}

// ── Constants ──────────────────────────────────────────────────────────────
const CHANNEL_COLORS = [
  'rgba(34, 197, 94, 0.7)',   // Organic Search — green
  'rgba(59, 130, 246, 0.7)',  // Direct — blue
  'rgba(168, 85, 247, 0.7)',  // Referral — purple
  'rgba(236, 72, 153, 0.7)',  // Organic Social — pink
  'rgba(249, 115, 22, 0.7)',  // Paid Search — orange
  'rgba(234, 179, 8, 0.7)',   // Email — yellow
  'rgba(20, 184, 166, 0.7)',  // Affiliates — teal
  'rgba(239, 68, 68, 0.7)',   // Display — red
  'rgba(156, 163, 175, 0.7)', // (Other) — gray
]

const ranges = [
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '180d', label: '180d' },
]

// ── State ──────────────────────────────────────────────────────────────────
const selectedPropertyId = ref('')
const range = ref('30d')
const loading = ref(false)

const properties = ref<any[]>([])
const pageMetrics = ref<PageMetric[]>([])
const trafficSources = ref<TrafficSource[]>([])
const channelTrend = ref<ChannelTrend | null>(null)

// ── Fetch properties ───────────────────────────────────────────────────────
async function loadProperties() {
  try {
    const res = await $fetch<{ data: any[] }>('/api/properties')
    properties.value = res.data
    if (properties.value.length) {
      selectedPropertyId.value = properties.value[0]._id
      loadData()
    }
  } catch {
    // silent
  }
}

// ── Load all data ──────────────────────────────────────────────────────────
async function loadData() {
  if (!selectedPropertyId.value) return
  loading.value = true
  try {
    const [pagesRes, sourcesRes, trendRes] = await Promise.all([
      $fetch<any>(`/api/ga4/page-metrics?propertyId=${selectedPropertyId.value}&range=${range.value}&limit=200&sort=sessions`),
      $fetch<any>(`/api/ga4/traffic-sources?propertyId=${selectedPropertyId.value}&range=${range.value}`),
      $fetch<any>(`/api/ga4/channel-trend?propertyId=${selectedPropertyId.value}&range=${range.value}`),
    ])
    pageMetrics.value = pagesRes?.data ?? []
    trafficSources.value = sourcesRes?.data ?? []
    channelTrend.value = trendRes?.dates?.length ? trendRes : null
  } finally {
    loading.value = false
  }
}

watch(range, () => { if (selectedPropertyId.value) loadData() })
onMounted(loadProperties)

// ── A4: Scatter plot ───────────────────────────────────────────────────────
function median(arr: number[]): number {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const medianX = computed(() => median(pageMetrics.value.map(p => p.sessions)))
const medianY = computed(() => median(pageMetrics.value.map(p => p.engagementRate * 100)))

const scatterPoints = computed(() =>
  pageMetrics.value.map(p => {
    const x = p.sessions
    const y = p.engagementRate * 100
    const aboveX = x >= medianX.value
    const aboveY = y >= medianY.value
    const quadrant: 'star' | 'underrated' | 'risky' | 'weak' =
      aboveX && aboveY ? 'star' :
      !aboveX && aboveY ? 'underrated' :
      aboveX && !aboveY ? 'risky' : 'weak'
    return { x, y, label: p.pagePath, quadrant }
  })
)

const quadrantCounts = computed(() => {
  const counts = { star: 0, underrated: 0, risky: 0, weak: 0 }
  for (const p of scatterPoints.value) counts[p.quadrant]++
  return counts
})

const starPages = computed(() =>
  pageMetrics.value
    .filter(p => p.sessions >= medianX.value && p.engagementRate * 100 >= medianY.value)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10)
)

const underratedPages = computed(() =>
  pageMetrics.value
    .filter(p => p.sessions < medianX.value && p.engagementRate * 100 >= medianY.value)
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 10)
)

// ── A6: Channel stacked area ───────────────────────────────────────────────
const channelTrendSeries = computed(() => {
  if (!channelTrend.value) return []
  return channelTrend.value.series.map((s, i) => ({
    channel: s.channel,
    values: s.values,
    color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
  }))
})

// ── C1: Conversions per page ───────────────────────────────────────────────
const conversionPageData = computed(() =>
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

const maxConvRate = computed(() =>
  conversionPageData.value.reduce((m, p) => Math.max(m, p.convRate), 0.001)
)

// ── C2: Conversions per channel ────────────────────────────────────────────
function mediumToChannel(medium: string): string {
  const m = medium.toLowerCase()
  if (m === 'organic') return 'Organic Search'
  if (m === 'cpc' || m === 'ppc' || m === 'paid') return 'Paid Search'
  if (m === 'email') return 'Email'
  if (m === 'social' || m === 'social-network') return 'Organic Social'
  if (m === 'referral') return 'Referral'
  if (m === '(none)' || m === 'none') return 'Direct'
  return 'Other'
}

interface ChannelAgg {
  channel: string
  sessions: number
  conversions: number
  convRate: number
  pct: number
}

const conversionChannelData = computed<ChannelAgg[]>(() => {
  const map: Record<string, { sessions: number; conversions: number }> = {}
  for (const s of trafficSources.value) {
    const ch = s.channelGroup && s.channelGroup !== '(Other)' ? s.channelGroup : mediumToChannel(s.medium)
    if (!map[ch]) map[ch] = { sessions: 0, conversions: 0 }
    map[ch].sessions += s.sessions
    map[ch].conversions += s.conversions
  }

  // Only show channels with conversions (or all if none have conversions)
  const rows = Object.entries(map)
    .filter(([, v]) => v.conversions > 0)
    .map(([channel, v]) => ({ channel, ...v, convRate: v.sessions > 0 ? (v.conversions / v.sessions) * 100 : 0, pct: 0 }))
    .sort((a, b) => b.conversions - a.conversions)

  if (!rows.length) return []

  const total = rows.reduce((s, r) => s + r.conversions, 0)
  return rows.map(r => ({ ...r, pct: total > 0 ? (r.conversions / total) * 100 : 0 }))
})
</script>

