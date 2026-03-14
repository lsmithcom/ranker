<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-gray-900">Dashboard</h1>
      <select
        v-model="selectedPropertyId"
        class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 min-w-52"
      >
        <option value="">Select a property…</option>
        <option v-for="p in properties" :key="p._id" :value="p._id">{{ p.propertyName }}</option>
      </select>
    </div>

    <!-- ── Analytics (only when a property is selected) ──────── -->
    <template v-if="selectedPropertyId">

      <!-- ── Section 1: Performance Charts ──────────────────── -->
      <div class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-700">Performance Overview</h2>
          <div class="flex gap-1 bg-gray-100 rounded p-0.5">
            <button
              v-for="r in chartRanges"
              :key="r.value"
              @click="chartRange = r.value"
              :class="[
                'text-xs px-3 py-1 rounded transition-colors',
                chartRange === r.value ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700',
              ]"
            >
              {{ r.label }}
            </button>
          </div>
        </div>

        <div v-if="chartsLoading" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="bg-white shadow-sm rounded-lg p-5 h-48 animate-pulse" />
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <!-- Avg Position -->
          <div class="bg-white shadow-sm rounded-lg p-5">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Avg Position</span>
              <span class="text-xs text-gray-300">(lower = better)</span>
            </div>
            <div class="text-2xl font-bold text-gray-800 mb-4 tabular-nums">
              {{ latestAvgPosition != null ? latestAvgPosition.toFixed(1) : '—' }}
            </div>
            <div class="h-24">
              <DashboardChart
                :labels="chartLabels"
                :values="positionValues"
                color="#7B9ED0"
                fill-color="rgba(123,158,208,0.12)"
                :invertY="true"
                tooltip-label="Position"
              />
            </div>
          </div>

          <!-- Organic Traffic -->
          <div class="bg-white shadow-sm rounded-lg p-5">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Organic Traffic</span>
              <span class="text-xs text-gray-300">(clicks)</span>
            </div>
            <div class="text-2xl font-bold text-gray-800 mb-4 tabular-nums">
              {{ latestClicks != null ? latestClicks.toLocaleString() : '—' }}
            </div>
            <div class="h-24">
              <DashboardChart
                :labels="chartLabels"
                :values="clickValues"
                color="#72A98A"
                fill-color="rgba(114,169,138,0.12)"
                tooltip-label="Clicks"
              />
            </div>
          </div>

          <!-- Unique Terms -->
          <div class="bg-white shadow-sm rounded-lg p-5">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Unique Terms</span>
              <span class="text-xs text-gray-300">(per day)</span>
            </div>
            <div class="text-2xl font-bold text-gray-800 mb-4 tabular-nums">
              {{ latestUniqueTerms != null ? latestUniqueTerms.toLocaleString() : '—' }}
            </div>
            <div class="h-24">
              <DashboardChart
                :labels="chartLabels"
                :values="uniqueTermValues"
                color="#9E84B8"
                fill-color="rgba(158,132,184,0.12)"
                tooltip-label="Terms"
              />
            </div>
          </div>

        </div>
      </div>

      <!-- ── Section 2: Performance Distribution ───────────── -->
      <div class="mb-10">
        <h2 class="text-base font-semibold text-gray-700 mb-4">Performance Distribution</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DistributionBox
            title="Keywords"
            :labels="distKeywordsLabels"
            :data="distKeywords"
          />
          <DistributionBox
            title="Search Terms"
            :labels="distBulkLabels"
            :data="distBulk"
          />
        </div>
      </div>

      <!-- ── Section 3: Tracked Keyword Panels ─────────────── -->
      <div class="mb-10">
        <h2 class="text-base font-semibold text-gray-700 mb-4">Tracked Keywords</h2>
        <div v-if="keywordsLoading" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="bg-white shadow-sm rounded-lg h-64 animate-pulse" />
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KeywordPanel
            title="Top Keywords"
            subtitle="Best ranking positions"
            :items="topTrackedKeywords"
            mode="top"
          />
          <KeywordPanel
            title="Biggest Jumps"
            subtitle="Largest position gains"
            :items="jumpedTrackedKeywords"
            mode="jumped"
          />
          <KeywordPanel
            title="Biggest Drops"
            subtitle="Largest position declines"
            :items="droppedTrackedKeywords"
            mode="dropped"
          />
        </div>
      </div>

      <!-- ── Section 3: Search Term Panels ──────────────────── -->
      <div class="mb-10">
        <h2 class="text-base font-semibold text-gray-700 mb-4">Search Terms</h2>
        <div v-if="bulkLoading" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="bg-white shadow-sm rounded-lg h-64 animate-pulse" />
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KeywordPanel
            title="Top Terms"
            subtitle="Best ranking search terms"
            :items="topBulkTerms"
            mode="top"
          />
          <KeywordPanel
            title="Biggest Jumps"
            subtitle="Largest position gains"
            :items="jumpedBulkTerms"
            mode="jumped"
          />
          <KeywordPanel
            title="Biggest Drops"
            subtitle="Largest position declines"
            :items="droppedBulkTerms"
            mode="dropped"
          />
        </div>
      </div>

    </template>

    <!-- No property selected prompt -->
    <div v-else-if="!propertiesLoading && !properties.length" class="text-sm text-gray-500 bg-white shadow-sm rounded p-6 text-center">
      No properties yet.
      <NuxtLink to="/settings" class="text-indigo-600 hover:underline">Go to Settings</NuxtLink>
      to add your first GSC property.
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

// ── Types ────────────────────────────────────────────────────────

interface PanelItem {
  keyword: string
  latestPosition: number | null
  positionChange: number | null
}

interface Property {
  _id: string
  propertyName: string
}

interface Keyword {
  _id: string
  keyword: string
  latestPosition: number | null
  positionChange: number | null
}

interface BulkTerm {
  keyword: string
  latestPosition: number | null
  positionChange: number | null
}

interface DistributionPoint {
  date: string
  top1: number
  top2_5: number
  top5_10: number
  top10_20: number
  top20_50: number
  top50_100: number
}

interface ChartPoint {
  date: string
  avgPosition: number
  totalClicks: number
  uniqueTerms: number
}

// ── Properties ───────────────────────────────────────────────────

const properties = ref<Property[]>([])
const propertiesLoading = ref(true)
const selectedPropertyId = ref('')

// ── Keywords ─────────────────────────────────────────────────────

const keywords = ref<Keyword[]>([])
const keywordsLoading = ref(false)

// ── Bulk terms ───────────────────────────────────────────────────

const bulkTerms = ref<BulkTerm[]>([])
const bulkLoading = ref(false)

// ── Distribution ─────────────────────────────────────────────────

const distKeywords = ref<DistributionPoint[]>([])
const distBulk = ref<DistributionPoint[]>([])

const distKeywordsLabels = computed(() =>
  distKeywords.value.map((p) => {
    const d = new Date(p.date + 'T00:00:00')
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
)
const distBulkLabels = computed(() =>
  distBulk.value.map((p) => {
    const d = new Date(p.date + 'T00:00:00')
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
)

// ── Charts ───────────────────────────────────────────────────────

const chartRanges = [
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '180D', value: '180d' },
]
const chartRange = ref<'30d' | '90d' | '180d'>('30d')
const chartsLoading = ref(false)
const chartPoints = ref<ChartPoint[]>([])

const chartLabels = computed(() =>
  chartPoints.value.map((p) => {
    const d = new Date(p.date + 'T00:00:00')
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
)
const positionValues = computed(() => chartPoints.value.map((p) => p.avgPosition))
const clickValues = computed(() => chartPoints.value.map((p) => p.totalClicks))
const uniqueTermValues = computed(() => chartPoints.value.map((p) => p.uniqueTerms))

const latestAvgPosition = computed(() => chartPoints.value.at(-1)?.avgPosition ?? null)
const latestClicks = computed(() => chartPoints.value.at(-1)?.totalClicks ?? null)
const latestUniqueTerms = computed(() => chartPoints.value.at(-1)?.uniqueTerms ?? null)

// ── Keyword panels (tracked) ─────────────────────────────────────

const topTrackedKeywords = computed<PanelItem[]>(() =>
  [...keywords.value]
    .filter((k) => k.latestPosition != null)
    .sort((a, b) => (a.latestPosition ?? 999) - (b.latestPosition ?? 999))
    .slice(0, 7)
)

const jumpedTrackedKeywords = computed<PanelItem[]>(() =>
  [...keywords.value]
    .filter((k) => k.positionChange != null && k.positionChange > 0)
    .sort((a, b) => (b.positionChange ?? 0) - (a.positionChange ?? 0))
    .slice(0, 7)
)

const droppedTrackedKeywords = computed<PanelItem[]>(() =>
  [...keywords.value]
    .filter((k) => k.positionChange != null && k.positionChange < 0)
    .sort((a, b) => (a.positionChange ?? 0) - (b.positionChange ?? 0))
    .slice(0, 7)
)

// ── Keyword panels (bulk) ────────────────────────────────────────

const topBulkTerms = computed<PanelItem[]>(() =>
  [...bulkTerms.value]
    .filter((k) => k.latestPosition != null)
    .sort((a, b) => (a.latestPosition ?? 999) - (b.latestPosition ?? 999))
    .slice(0, 7)
)

const jumpedBulkTerms = computed<PanelItem[]>(() =>
  [...bulkTerms.value]
    .filter((k) => k.positionChange != null && k.positionChange > 0)
    .sort((a, b) => (b.positionChange ?? 0) - (a.positionChange ?? 0))
    .slice(0, 7)
)

const droppedBulkTerms = computed<PanelItem[]>(() =>
  [...bulkTerms.value]
    .filter((k) => k.positionChange != null && k.positionChange < 0)
    .sort((a, b) => (a.positionChange ?? 0) - (b.positionChange ?? 0))
    .slice(0, 7)
)

// ── Data loaders ─────────────────────────────────────────────────

async function loadProperties() {
  propertiesLoading.value = true
  try {
    const res = await $fetch<{ data: Property[] }>('/api/properties')
    properties.value = res.data
    if (properties.value.length) {
      selectedPropertyId.value = properties.value[0]._id
    }
  } catch {
    // silent
  } finally {
    propertiesLoading.value = false
  }
}

async function loadCharts() {
  if (!selectedPropertyId.value) return
  chartsLoading.value = true
  try {
    const res = await $fetch<{ success: boolean; data: ChartPoint[] }>('/api/rankings/dashboard-charts', {
      query: { propertyId: selectedPropertyId.value, range: chartRange.value },
    })
    chartPoints.value = res.data || []
  } catch {
    chartPoints.value = []
  } finally {
    chartsLoading.value = false
  }
}

async function loadKeywords() {
  if (!selectedPropertyId.value) return
  keywordsLoading.value = true
  try {
    const res = await $fetch<{ data: Keyword[] }>(`/api/keywords?propertyId=${selectedPropertyId.value}`)
    keywords.value = res.data
  } catch {
    // silent
  } finally {
    keywordsLoading.value = false
  }
}

async function loadBulkTerms() {
  if (!selectedPropertyId.value) return
  bulkLoading.value = true
  try {
    const res = await $fetch<{ data: BulkTerm[] }>('/api/rankings/bulk-summary', {
      query: { propertyId: selectedPropertyId.value, pageSize: 1000 },
    })
    bulkTerms.value = res.data || []
  } catch {
    bulkTerms.value = []
  } finally {
    bulkLoading.value = false
  }
}

async function loadDistribution() {
  if (!selectedPropertyId.value) return
  const params = { propertyId: selectedPropertyId.value, range: chartRange.value }
  try {
    const [kwRes, bulkRes] = await Promise.all([
      $fetch<{ success: boolean; data: DistributionPoint[] }>('/api/rankings/distribution', {
        query: { ...params, source: 'specific_query' },
      }),
      $fetch<{ success: boolean; data: DistributionPoint[] }>('/api/rankings/distribution', {
        query: { ...params, source: 'bulk_discovery' },
      }),
    ])
    distKeywords.value = kwRes.data || []
    distBulk.value = bulkRes.data || []
  } catch {
    distKeywords.value = []
    distBulk.value = []
  }
}

// ── Watchers ─────────────────────────────────────────────────────

watch(selectedPropertyId, () => {
  keywords.value = []
  bulkTerms.value = []
  chartPoints.value = []
  distKeywords.value = []
  distBulk.value = []
  loadCharts()
  loadKeywords()
  loadBulkTerms()
  loadDistribution()
})

watch(chartRange, () => {
  loadCharts()
  loadDistribution()
})

onMounted(loadProperties)
</script>
