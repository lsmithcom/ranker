<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- ── Header ─────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 class="text-xl font-semibold text-gray-900">Search Performance</h1>
      <div class="flex items-center gap-3">
        <select
          v-model="selectedPropertyId"
          class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 min-w-48"
        >
          <option value="">Select a property…</option>
          <option v-for="p in properties" :key="p._id" :value="p._id">{{ p.propertyName }}</option>
        </select>
        <div class="flex gap-1 bg-gray-100 rounded p-0.5">
          <button
            v-for="r in ranges"
            :key="r.value"
            @click="range = r.value"
            :class="[
              'text-xs px-3 py-1 rounded transition-colors',
              range === r.value ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            {{ r.label }}
          </button>
        </div>
      </div>
    </div>

    <template v-if="selectedPropertyId">

      <!-- ── KPI Cards ───────────────────────────────────────── -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">

        <!-- Clicks -->
        <div class="bg-white shadow-sm rounded-lg p-4">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Clicks</div>
          <div class="text-2xl font-bold text-gray-800 tabular-nums mb-1">
            <span v-if="chartsLoading" class="inline-block w-20 h-7 bg-gray-100 rounded animate-pulse" />
            <span v-else>{{ currentClicks.toLocaleString() }}</span>
          </div>
          <div v-if="!chartsLoading && clicksDeltaPct != null" class="flex items-center gap-1 text-xs">
            <span :class="clicksDeltaPct >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'">
              {{ clicksDeltaPct >= 0 ? '▲' : '▼' }} {{ Math.abs(clicksDeltaPct).toFixed(1) }}%
            </span>
            <span class="text-gray-400">vs prior {{ rangeLabel }}</span>
          </div>
          <div v-else-if="!chartsLoading" class="text-xs text-gray-300">{{ rangeLabel }}</div>
        </div>

        <!-- Avg Position -->
        <div class="bg-white shadow-sm rounded-lg p-4">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Avg Position</div>
          <div class="text-2xl font-bold text-gray-800 tabular-nums mb-1">
            <span v-if="chartsLoading" class="inline-block w-16 h-7 bg-gray-100 rounded animate-pulse" />
            <span v-else>{{ currentAvgPos != null ? currentAvgPos.toFixed(1) : '—' }}</span>
          </div>
          <div v-if="!chartsLoading && posDelta != null" class="flex items-center gap-1 text-xs">
            <!-- posDelta positive = improved (lower number) -->
            <span :class="posDelta > 0 ? 'text-green-600 font-medium' : posDelta < 0 ? 'text-red-500 font-medium' : 'text-gray-400'">
              {{ posDelta > 0 ? '▲' : '▼' }} {{ Math.abs(posDelta).toFixed(1) }} pos
            </span>
            <span class="text-gray-400">vs prior</span>
          </div>
          <div v-else-if="!chartsLoading" class="text-xs text-gray-300">lower = better</div>
        </div>

        <!-- Impressions -->
        <div class="bg-white shadow-sm rounded-lg p-4">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Impressions</div>
          <div class="text-2xl font-bold text-gray-800 tabular-nums mb-1">
            <span v-if="dataLoading" class="inline-block w-20 h-7 bg-gray-100 rounded animate-pulse" />
            <span v-else>{{ totalImpressions.toLocaleString() }}</span>
          </div>
          <div v-if="!dataLoading && overallCtr != null" class="text-xs text-gray-400">
            {{ overallCtr.toFixed(2) }}% CTR
          </div>
          <div v-else-if="!dataLoading" class="text-xs text-gray-300">latest snapshot</div>
        </div>

        <!-- Tracked Keywords -->
        <div class="bg-white shadow-sm rounded-lg p-4">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Tracked Keywords</div>
          <div class="text-2xl font-bold text-gray-800 tabular-nums mb-1">
            <span v-if="dataLoading" class="inline-block w-12 h-7 bg-gray-100 rounded animate-pulse" />
            <span v-else>{{ keywords.length.toLocaleString() }}</span>
          </div>
          <div v-if="!dataLoading" class="text-xs text-gray-400">
            {{ kwWithPosition.toLocaleString() }} ranked
          </div>
        </div>

        <!-- Search Terms -->
        <div class="bg-white shadow-sm rounded-lg p-4">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Search Terms</div>
          <div class="text-2xl font-bold text-gray-800 tabular-nums mb-1">
            <span v-if="dataLoading" class="inline-block w-16 h-7 bg-gray-100 rounded animate-pulse" />
            <span v-else>{{ bulkTerms.length.toLocaleString() }}</span>
          </div>
          <div v-if="!dataLoading" class="text-xs text-gray-400">
            {{ bulkWithPosition.toLocaleString() }} ranked
          </div>
        </div>

      </div>

      <!-- ── Section Links ─────────────────────────────────────── -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <NuxtLink
          to="/keywords"
          class="bg-white shadow-sm rounded-lg px-4 py-3 flex items-center justify-between group hover:shadow transition-shadow"
        >
          <div>
            <div class="text-xs font-medium text-gray-400 uppercase tracking-wide">Tracked Keywords</div>
            <div class="text-sm font-medium text-gray-700 mt-0.5">Manage &amp; analyse keywords</div>
          </div>
          <span class="text-gray-300 group-hover:text-gray-500 transition-colors text-lg">→</span>
        </NuxtLink>
        <NuxtLink
          to="/search-terms"
          class="bg-white shadow-sm rounded-lg px-4 py-3 flex items-center justify-between group hover:shadow transition-shadow"
        >
          <div>
            <div class="text-xs font-medium text-gray-400 uppercase tracking-wide">Search Terms</div>
            <div class="text-sm font-medium text-gray-700 mt-0.5">Explore GSC bulk terms</div>
          </div>
          <span class="text-gray-300 group-hover:text-gray-500 transition-colors text-lg">→</span>
        </NuxtLink>
        <NuxtLink
          to="/pages"
          class="bg-white shadow-sm rounded-lg px-4 py-3 flex items-center justify-between group hover:shadow transition-shadow"
        >
          <div>
            <div class="text-xs font-medium text-gray-400 uppercase tracking-wide">Ranking Pages</div>
            <div class="text-sm font-medium text-gray-700 mt-0.5">Top pages by position</div>
          </div>
          <span class="text-gray-300 group-hover:text-gray-500 transition-colors text-lg">→</span>
        </NuxtLink>
      </div>

      <!-- ── Distribution + Movers ────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        <!-- Position Distribution: Keywords -->
        <div class="bg-white shadow-sm rounded-lg p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Keywords by Position</h2>
          <div v-if="dataLoading" class="h-40 flex items-center justify-center">
            <div class="w-32 h-32 rounded-full border-8 border-gray-100 animate-pulse" />
          </div>
          <div v-else class="h-40">
            <ClientOnly>
              <SearchDonutChart :segments="kwDonutSegments" />
            </ClientOnly>
          </div>
          <div class="mt-3 grid grid-cols-3 gap-1">
            <div v-for="seg in donutLegend" :key="seg.label" class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: seg.color }" />
              <span class="text-xs text-gray-500">{{ seg.label }}</span>
              <span class="text-xs font-medium text-gray-700 ml-auto">{{ kwBuckets[seg.key] ?? 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Position Distribution: Search Terms -->
        <div class="bg-white shadow-sm rounded-lg p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Search Terms by Position</h2>
          <div v-if="dataLoading" class="h-40 flex items-center justify-center">
            <div class="w-32 h-32 rounded-full border-8 border-gray-100 animate-pulse" />
          </div>
          <div v-else class="h-40">
            <ClientOnly>
              <SearchDonutChart :segments="bulkDonutSegments" />
            </ClientOnly>
          </div>
          <div class="mt-3 grid grid-cols-3 gap-1">
            <div v-for="seg in donutLegend" :key="seg.label" class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: seg.color }" />
              <span class="text-xs text-gray-500">{{ seg.label }}</span>
              <span class="text-xs font-medium text-gray-700 ml-auto">{{ bulkBuckets[seg.key] ?? 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Movers -->
        <div class="bg-white shadow-sm rounded-lg p-4">
          <div class="flex items-center gap-2 mb-3">
            <h2 class="text-sm font-semibold text-gray-700">Movers</h2>
            <div class="flex gap-1 bg-gray-100 rounded p-0.5 ml-auto">
              <button
                @click="moversTab = 'gainers'"
                :class="['text-xs px-2.5 py-0.5 rounded transition-colors', moversTab === 'gainers' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500']"
              >
                ▲ Gainers
              </button>
              <button
                @click="moversTab = 'drops'"
                :class="['text-xs px-2.5 py-0.5 rounded transition-colors', moversTab === 'drops' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500']"
              >
                ▼ Drops
              </button>
            </div>
          </div>
          <div v-if="dataLoading" class="space-y-2">
            <div v-for="i in 7" :key="i" class="h-7 bg-gray-100 rounded animate-pulse" />
          </div>
          <div v-else>
            <div v-if="moversTab === 'gainers'">
              <div v-if="!topGainers.length" class="text-xs text-gray-400 py-4 text-center">No position gains recorded yet.</div>
              <div
                v-for="item in topGainers"
                :key="item.keyword"
                class="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
              >
                <span
                  class="text-xs px-1 py-0.5 rounded font-medium shrink-0"
                  :class="item.type === 'kw' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'"
                >
                  {{ item.type === 'kw' ? 'KW' : 'ST' }}
                </span>
                <span class="text-sm text-gray-700 truncate flex-1 min-w-0" :title="item.keyword">{{ item.keyword }}</span>
                <span class="text-xs shrink-0" :class="posBadgeClass(item.pos)">
                  {{ item.pos != null ? '#' + Math.round(item.pos) : '—' }}
                </span>
                <span class="text-xs text-green-600 font-medium shrink-0 w-12 text-right">
                  ▲ {{ (item.change ?? 0).toFixed(1) }}
                </span>
              </div>
            </div>
            <div v-else>
              <div v-if="!topDroppers.length" class="text-xs text-gray-400 py-4 text-center">No position drops recorded yet.</div>
              <div
                v-for="item in topDroppers"
                :key="item.keyword"
                class="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
              >
                <span
                  class="text-xs px-1 py-0.5 rounded font-medium shrink-0"
                  :class="item.type === 'kw' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'"
                >
                  {{ item.type === 'kw' ? 'KW' : 'ST' }}
                </span>
                <span class="text-sm text-gray-700 truncate flex-1 min-w-0" :title="item.keyword">{{ item.keyword }}</span>
                <span class="text-xs shrink-0" :class="posBadgeClass(item.pos)">
                  {{ item.pos != null ? '#' + Math.round(item.pos) : '—' }}
                </span>
                <span class="text-xs text-red-500 font-medium shrink-0 w-12 text-right">
                  ▼ {{ Math.abs(item.change ?? 0).toFixed(1) }}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ── CTR by Position Bucket ────────────────────────────── -->
      <div class="bg-white shadow-sm rounded-lg p-4 mb-6">
        <h2 class="text-sm font-semibold text-gray-700 mb-1">CTR by Position</h2>
        <p class="text-xs text-gray-400 mb-4">Average click-through rate for each ranking position range — across keywords and search terms combined.</p>
        <div v-if="dataLoading" class="h-40 bg-gray-50 rounded animate-pulse" />
        <div v-else class="h-40">
          <ClientOnly>
            <SearchBarChart
              :labels="ctrBucketLabels"
              :values="ctrBucketValues"
              :colors="ctrBucketColors"
              suffix="%"
            />
          </ClientOnly>
        </div>
      </div>

      <!-- ── Top Performers ────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        <!-- Top Keywords by Clicks -->
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-700">Top Keywords by Clicks</h2>
            <NuxtLink to="/keywords" class="text-xs text-indigo-600 hover:underline">View all →</NuxtLink>
          </div>
          <div v-if="dataLoading" class="p-4 space-y-2">
            <div v-for="i in 8" :key="i" class="h-7 bg-gray-100 rounded animate-pulse" />
          </div>
          <table v-else class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pos</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Clicks</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Impr</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Δ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-if="!topKwByClicks.length">
                <td colspan="5" class="px-4 py-6 text-center text-xs text-gray-400">No data yet.</td>
              </tr>
              <tr v-for="kw in topKwByClicks" :key="kw.keyword" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-700 truncate max-w-[180px]" :title="kw.keyword">{{ kw.keyword }}</td>
                <td class="px-3 py-2 text-right">
                  <span class="text-xs px-1.5 py-0.5 rounded font-medium tabular-nums" :class="posBadgeClass(kw.latestPosition)">
                    {{ kw.latestPosition != null ? kw.latestPosition.toFixed(1) : '—' }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right text-gray-800 tabular-nums text-xs">{{ (kw.latestClicks ?? 0).toLocaleString() }}</td>
                <td class="px-3 py-2 text-right text-gray-500 tabular-nums text-xs">{{ (kw.latestImpressions ?? 0).toLocaleString() }}</td>
                <td class="px-3 py-2 text-right text-xs tabular-nums" :class="changeClass(kw.positionChange)">
                  {{ formatChange(kw.positionChange) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Top Search Terms by Clicks -->
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-700">Top Search Terms by Clicks</h2>
            <NuxtLink to="/search-terms" class="text-xs text-indigo-600 hover:underline">View all →</NuxtLink>
          </div>
          <div v-if="dataLoading" class="p-4 space-y-2">
            <div v-for="i in 8" :key="i" class="h-7 bg-gray-100 rounded animate-pulse" />
          </div>
          <table v-else class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Search Term</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pos</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Clicks</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Impr</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Δ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-if="!topBulkByClicks.length">
                <td colspan="5" class="px-4 py-6 text-center text-xs text-gray-400">No data yet.</td>
              </tr>
              <tr v-for="term in topBulkByClicks" :key="term.keyword" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-700 truncate max-w-[180px]" :title="term.keyword">{{ term.keyword }}</td>
                <td class="px-3 py-2 text-right">
                  <span class="text-xs px-1.5 py-0.5 rounded font-medium tabular-nums" :class="posBadgeClass(term.latestPosition)">
                    {{ term.latestPosition != null ? term.latestPosition.toFixed(1) : '—' }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right text-gray-800 tabular-nums text-xs">{{ (term.latestClicks ?? 0).toLocaleString() }}</td>
                <td class="px-3 py-2 text-right text-gray-500 tabular-nums text-xs">{{ (term.latestImpressions ?? 0).toLocaleString() }}</td>
                <td class="px-3 py-2 text-right text-xs tabular-nums" :class="changeClass(term.positionChange)">
                  {{ formatChange(term.positionChange) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- ── Trend Chart ────────────────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div class="bg-white shadow-sm rounded-lg p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Clicks Over Time</h2>
          <div v-if="chartsLoading" class="h-36 bg-gray-50 rounded animate-pulse" />
          <div v-else class="h-36">
            <DashboardChart
              :labels="chartLabels"
              :values="clickValues"
              color="#6366f1"
              fill-color="rgba(99,102,241,0.08)"
              tooltip-label="Clicks"
            />
          </div>
        </div>
        <div class="bg-white shadow-sm rounded-lg p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Avg Position Over Time</h2>
          <div v-if="chartsLoading" class="h-36 bg-gray-50 rounded animate-pulse" />
          <div v-else class="h-36">
            <DashboardChart
              :labels="chartLabels"
              :values="posValues"
              color="#f59e0b"
              fill-color="rgba(245,158,11,0.08)"
              :invertY="true"
              tooltip-label="Avg Pos"
            />
          </div>
        </div>
      </div>

    </template>

    <div v-else-if="!propertiesLoading && !properties.length" class="text-sm text-gray-500 bg-white shadow-sm rounded p-6 text-center">
      No properties yet. <NuxtLink to="/settings" class="text-indigo-600 hover:underline">Go to Settings</NuxtLink> to add your first GSC property.
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

// ── Types ─────────────────────────────────────────────────────────

interface Property { _id: string; propertyName: string }

interface Keyword {
  _id: string
  keyword: string
  latestPosition: number | null
  previousPosition: number | null
  latestClicks: number | null
  latestImpressions: number | null
  positionChange: number | null
}

interface BulkTerm {
  keyword: string
  latestPosition: number | null
  latestClicks: number | null
  latestImpressions: number | null
  positionChange: number | null
}

interface ChartPoint {
  date: string
  avgPosition: number
  totalClicks: number
  uniqueTerms: number
}

// ── State ──────────────────────────────────────────────────────────

const properties = ref<Property[]>([])
const propertiesLoading = ref(true)
const selectedPropertyId = ref('')

const keywords = ref<Keyword[]>([])
const bulkTerms = ref<BulkTerm[]>([])
const dataLoading = ref(false)

const allChartPoints = ref<ChartPoint[]>([]) // always 180d
const chartsLoading = ref(false)

const moversTab = ref<'gainers' | 'drops'>('gainers')

const ranges = [
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '180d', value: '180d' },
]
const range = ref('30d')

// ── Bucket config ─────────────────────────────────────────────────

const BUCKETS = [
  { key: 'top1',     label: '#1',    color: '#f59e0b' },
  { key: 'top2_5',   label: '2–5',   color: '#22c55e' },
  { key: 'top5_10',  label: '6–10',  color: '#10b981' },
  { key: 'top10_20', label: '11–20', color: '#3b82f6' },
  { key: 'top20_50', label: '21–50', color: '#f97316' },
  { key: 'top50_100',label: '51+',   color: '#d1d5db' },
]

const donutLegend = BUCKETS

function bucketKey(pos: number | null): string | null {
  if (pos == null) return null
  if (pos <= 1)  return 'top1'
  if (pos <= 5)  return 'top2_5'
  if (pos <= 10) return 'top5_10'
  if (pos <= 20) return 'top10_20'
  if (pos <= 50) return 'top20_50'
  return 'top50_100'
}

// ── Range helpers ─────────────────────────────────────────────────

const rangeN = computed(() => range.value === '180d' ? 180 : range.value === '90d' ? 90 : 30)
const rangeLabel = computed(() => range.value)

// Chart points for the selected range (from the always-180d fetch)
const currentPoints = computed(() => allChartPoints.value.slice(-rangeN.value))
const priorPoints = computed(() => {
  if (rangeN.value === 180) return []
  return allChartPoints.value.slice(-(rangeN.value * 2), -rangeN.value)
})

// ── KPI aggregates ────────────────────────────────────────────────

const currentClicks = computed(() =>
  currentPoints.value.reduce((s, p) => s + p.totalClicks, 0)
)
const priorClicks = computed(() =>
  priorPoints.value.reduce((s, p) => s + p.totalClicks, 0)
)
const clicksDeltaPct = computed(() => {
  if (!priorPoints.value.length || !priorClicks.value) return null
  return ((currentClicks.value - priorClicks.value) / priorClicks.value) * 100
})

const currentAvgPos = computed(() => {
  const pts = currentPoints.value.filter((p) => p.avgPosition > 0)
  if (!pts.length) return null
  return pts.reduce((s, p) => s + p.avgPosition, 0) / pts.length
})
const priorAvgPos = computed(() => {
  const pts = priorPoints.value.filter((p) => p.avgPosition > 0)
  if (!pts.length) return null
  return pts.reduce((s, p) => s + p.avgPosition, 0) / pts.length
})
// positive = improved (position number went down)
const posDelta = computed(() => {
  if (currentAvgPos.value == null || priorAvgPos.value == null) return null
  return priorAvgPos.value - currentAvgPos.value
})

const totalImpressions = computed(() =>
  keywords.value.reduce((s, k) => s + (k.latestImpressions ?? 0), 0) +
  bulkTerms.value.reduce((s, t) => s + (t.latestImpressions ?? 0), 0)
)
const totalClicks = computed(() =>
  keywords.value.reduce((s, k) => s + (k.latestClicks ?? 0), 0) +
  bulkTerms.value.reduce((s, t) => s + (t.latestClicks ?? 0), 0)
)
const overallCtr = computed(() => {
  if (!totalImpressions.value) return null
  return (totalClicks.value / totalImpressions.value) * 100
})
const kwWithPosition = computed(() => keywords.value.filter((k) => k.latestPosition != null).length)
const bulkWithPosition = computed(() => bulkTerms.value.filter((t) => t.latestPosition != null).length)

// ── Trend chart data ───────────────────────────────────────────────

const chartLabels = computed(() =>
  currentPoints.value.map((p) => {
    const [, m, d] = p.date.split('-')
    return `${parseInt(m)}/${parseInt(d)}`
  })
)
const clickValues = computed(() => currentPoints.value.map((p) => p.totalClicks))
const posValues = computed(() => currentPoints.value.map((p) => p.avgPosition))

// ── Position buckets ───────────────────────────────────────────────

const kwBuckets = computed(() => {
  const counts: Record<string, number> = {}
  for (const kw of keywords.value) {
    const b = bucketKey(kw.latestPosition)
    if (b) counts[b] = (counts[b] ?? 0) + 1
  }
  return counts
})

const bulkBuckets = computed(() => {
  const counts: Record<string, number> = {}
  for (const t of bulkTerms.value) {
    const b = bucketKey(t.latestPosition)
    if (b) counts[b] = (counts[b] ?? 0) + 1
  }
  return counts
})

const kwDonutSegments = computed(() =>
  BUCKETS.map((b) => ({ label: b.label, value: kwBuckets.value[b.key] ?? 0, color: b.color }))
)
const bulkDonutSegments = computed(() =>
  BUCKETS.map((b) => ({ label: b.label, value: bulkBuckets.value[b.key] ?? 0, color: b.color }))
)

// ── CTR by position bucket ─────────────────────────────────────────

const ctrByBucket = computed(() => {
  const byBucket: Record<string, { clicks: number; impressions: number }> = {}
  const all = [
    ...keywords.value.map((k) => ({ pos: k.latestPosition, clicks: k.latestClicks, impressions: k.latestImpressions })),
    ...bulkTerms.value.map((t) => ({ pos: t.latestPosition, clicks: t.latestClicks, impressions: t.latestImpressions })),
  ]
  for (const item of all) {
    const b = bucketKey(item.pos)
    if (!b || !item.impressions) continue
    if (!byBucket[b]) byBucket[b] = { clicks: 0, impressions: 0 }
    byBucket[b].clicks += item.clicks ?? 0
    byBucket[b].impressions += item.impressions
  }
  return BUCKETS.map((bc) => ({
    ...bc,
    ctr: byBucket[bc.key] ? (byBucket[bc.key].clicks / byBucket[bc.key].impressions) * 100 : 0,
  }))
})

const ctrBucketLabels = computed(() => ctrByBucket.value.map((b) => b.label))
const ctrBucketValues = computed(() => ctrByBucket.value.map((b) => b.ctr))
const ctrBucketColors = computed(() => ctrByBucket.value.map((b) => b.color))

// ── Movers ────────────────────────────────────────────────────────

const allMovers = computed(() => [
  ...keywords.value
    .filter((k) => k.positionChange != null)
    .map((k) => ({ keyword: k.keyword, pos: k.latestPosition, change: k.positionChange, type: 'kw' as const })),
  ...bulkTerms.value
    .filter((t) => t.positionChange != null)
    .map((t) => ({ keyword: t.keyword, pos: t.latestPosition, change: t.positionChange, type: 'st' as const })),
])

const topGainers = computed(() =>
  allMovers.value
    .filter((i) => (i.change ?? 0) > 0)
    .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
    .slice(0, 9)
)

const topDroppers = computed(() =>
  allMovers.value
    .filter((i) => (i.change ?? 0) < 0)
    .sort((a, b) => (a.change ?? 0) - (b.change ?? 0))
    .slice(0, 9)
)

// ── Top performers ────────────────────────────────────────────────

const topKwByClicks = computed(() =>
  [...keywords.value]
    .filter((k) => k.latestClicks != null)
    .sort((a, b) => (b.latestClicks ?? 0) - (a.latestClicks ?? 0))
    .slice(0, 10)
)

const topBulkByClicks = computed(() =>
  [...bulkTerms.value]
    .filter((t) => t.latestClicks != null)
    .sort((a, b) => (b.latestClicks ?? 0) - (a.latestClicks ?? 0))
    .slice(0, 10)
)

// ── Helpers ───────────────────────────────────────────────────────

function posBadgeClass(pos: number | null): string {
  if (pos == null) return 'bg-gray-100 text-gray-400'
  if (pos <= 3)  return 'bg-amber-100 text-amber-700'
  if (pos <= 10) return 'bg-green-100 text-green-700'
  if (pos <= 20) return 'bg-blue-100 text-blue-700'
  if (pos <= 50) return 'bg-orange-100 text-orange-600'
  return 'bg-gray-100 text-gray-500'
}

function changeClass(change: number | null): string {
  if (change == null) return 'text-gray-300'
  if (change > 0) return 'text-green-600 font-medium'
  if (change < 0) return 'text-red-500 font-medium'
  return 'text-gray-300'
}

function formatChange(change: number | null): string {
  if (change == null) return '—'
  if (change > 0) return `▲ ${change.toFixed(1)}`
  if (change < 0) return `▼ ${Math.abs(change).toFixed(1)}`
  return '—'
}

// ── Data loaders ───────────────────────────────────────────────────

async function loadProperties() {
  propertiesLoading.value = true
  try {
    const res = await $fetch<{ data: Property[] }>('/api/properties')
    properties.value = res.data || []
    if (properties.value.length === 1) {
      selectedPropertyId.value = properties.value[0]._id
    }
  } finally {
    propertiesLoading.value = false
  }
}

async function loadChartData() {
  if (!selectedPropertyId.value) return
  chartsLoading.value = true
  try {
    const res = await $fetch<{ data: ChartPoint[] }>('/api/rankings/dashboard-charts', {
      query: { propertyId: selectedPropertyId.value, range: '180d' },
    })
    allChartPoints.value = res.data || []
  } catch {
    allChartPoints.value = []
  } finally {
    chartsLoading.value = false
  }
}

async function loadData() {
  if (!selectedPropertyId.value) return
  dataLoading.value = true
  try {
    const [kwRes, bulkRes] = await Promise.all([
      $fetch<{ data: Keyword[] }>('/api/keywords', {
        query: { propertyId: selectedPropertyId.value },
      }),
      $fetch<{ data: BulkTerm[]; pagination: { total: number } }>('/api/rankings/bulk-summary', {
        query: { propertyId: selectedPropertyId.value, pageSize: 5000 },
      }),
    ])
    keywords.value = kwRes.data || []
    bulkTerms.value = bulkRes.data || []
  } catch {
    keywords.value = []
    bulkTerms.value = []
  } finally {
    dataLoading.value = false
  }
}

// ── Watchers ───────────────────────────────────────────────────────

watch(selectedPropertyId, () => {
  keywords.value = []
  bulkTerms.value = []
  allChartPoints.value = []
  loadChartData()
  loadData()
})

onMounted(loadProperties)
</script>
