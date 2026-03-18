<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-gray-900">Pages</h1>

      <!-- Property selector -->
      <select
        v-model="selectedPropertyId"
        class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
      >
        <option value="">Select a property…</option>
        <option v-for="p in properties" :key="p._id" :value="p._id">{{ p.propertyName }}</option>
      </select>
    </div>

    <template v-if="selectedPropertyId">
      <div class="flex items-center mb-4">
        <div class="ml-auto text-sm text-gray-500">{{ totalPageCount }} pages · {{ totalKeywordCount }} keywords</div>
      </div>

      <!-- Table -->
      <div class="bg-white shadow-sm rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th @click="setSort('page')" class="px-3 py-2.5 text-left font-medium text-gray-700 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap">
                Page / Keyword <span class="text-gray-400 text-xs">{{ sortCol === 'page' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}</span>
              </th>
              <th @click="setSort('impressions')" class="px-3 py-2.5 text-right font-medium text-gray-700 w-28 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap">
                Impressions <span class="text-gray-400 text-xs">{{ sortCol === 'impressions' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}</span>
              </th>
              <th class="px-3 py-2.5 text-right font-medium text-gray-700 w-20">CTR</th>
              <th @click="setSort('clicks')" class="px-3 py-2.5 text-right font-medium text-gray-700 w-24 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap">
                Clicks <span class="text-gray-400 text-xs">{{ sortCol === 'clicks' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}</span>
              </th>
              <th @click="setSort('latest')" class="px-3 py-2.5 text-right font-medium text-gray-700 w-24 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap">
                {{ latestDateLabel }} <span class="text-gray-400 text-xs">{{ sortCol === 'latest' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}</span>
              </th>
              <th @click="setSort('previous')" class="px-3 py-2.5 text-right font-medium text-gray-700 w-24 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap">
                {{ previousDateLabel }} <span class="text-gray-400 text-xs">{{ sortCol === 'previous' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}</span>
              </th>
              <th @click="setSort('change')" class="px-3 py-2.5 text-right font-medium text-gray-700 w-20 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap">
                Change <span class="text-gray-400 text-xs">{{ sortCol === 'change' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr>
                <td colspan="7" class="px-3 py-8 text-center text-gray-400">Loading…</td>
              </tr>
            </template>
            <template v-else-if="flatDisplayRows.length === 0">
              <tr>
                <td colspan="7" class="px-3 py-8 text-center text-gray-400">
                  No page data found. Run a bulk pull from the
                  <NuxtLink to="/import" class="text-indigo-600 hover:underline">Import</NuxtLink> page.
                </td>
              </tr>
            </template>
            <template v-else>
              <template v-for="row in flatDisplayRows" :key="row.id">
                <!-- Page header row -->
                <tr
                  v-if="row.type === 'page'"
                  class="bg-gray-50 border-t border-gray-200 cursor-pointer hover:bg-gray-100"
                  @click="togglePage(row.pageUrl!)"
                >
                  <td class="py-2 px-3 font-medium text-gray-800">
                    <span class="mr-1 inline-block" :class="collapsedPages.has(row.pageUrl!) ? '' : 'rotate-90'">▶</span>
                    <span class="font-mono text-xs">{{ pagePath(row.pageUrl!) }}</span>
                    <span class="ml-2 text-xs text-gray-400 font-normal">{{ row.keywords!.length }}</span>
                  </td>
                  <td class="px-3 py-2 text-right text-gray-400 tabular-nums text-xs">
                    {{ row.stats!.totalImpressions != null ? row.stats!.totalImpressions.toLocaleString() : '' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-400 tabular-nums text-xs">
                    {{ row.stats!.avgCtr != null ? row.stats!.avgCtr.toFixed(2) + '%' : '' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-400 tabular-nums text-xs">
                    {{ row.stats!.totalClicks != null ? row.stats!.totalClicks.toLocaleString() : '' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-400 tabular-nums text-xs">
                    {{ row.stats!.avgLatest != null ? row.stats!.avgLatest.toFixed(1) : '' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-400 tabular-nums text-xs">
                    {{ row.stats!.avgPrevious != null ? row.stats!.avgPrevious.toFixed(1) : '' }}
                  </td>
                  <td class="px-3 py-2 text-right text-xs">
                    <span v-if="row.stats!.medianChange != null" :class="changeClass(row.stats!.medianChange)">
                      {{ formatChange(row.stats!.medianChange) }}
                    </span>
                  </td>
                </tr>

                <!-- Keyword row -->
                <tr
                  v-else-if="row.type === 'keyword'"
                  :class="[
                    'border-t border-gray-100 cursor-pointer hover:bg-slate-50',
                    expandedKeywords.has(kwKey(row.kwRow!)) ? 'bg-slate-50' : 'bg-white',
                  ]"
                  @click="toggleKeyword(kwKey(row.kwRow!))"
                >
                  <td class="py-2" style="padding-left: 32px">
                    <span class="mr-1 text-gray-400 inline-block" :class="expandedKeywords.has(kwKey(row.kwRow!)) ? 'rotate-90' : ''">▶</span>
                    {{ row.kwRow!.keyword }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                    {{ row.kwRow!.latestImpressions != null ? row.kwRow!.latestImpressions.toLocaleString() : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                    {{ row.kwRow!.latestImpressions ? ((row.kwRow!.latestClicks ?? 0) / row.kwRow!.latestImpressions * 100).toFixed(2) + '%' : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                    {{ row.kwRow!.latestClicks != null ? row.kwRow!.latestClicks.toLocaleString() : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                    {{ row.kwRow!.latestPosition != null ? row.kwRow!.latestPosition.toFixed(1) : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-500 tabular-nums">
                    {{ row.kwRow!.previousPosition != null ? row.kwRow!.previousPosition.toFixed(1) : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right tabular-nums">
                    <span :class="changeClass(row.kwRow!.positionChange)">
                      {{ formatChange(row.kwRow!.positionChange) }}
                    </span>
                  </td>
                </tr>

                <!-- Chart row -->
                <tr v-else-if="row.type === 'chart'" class="bg-slate-50 border-t border-gray-100">
                  <td colspan="7" class="p-0">
                    <ClientOnly>
                      <RankingChart
                        :keyword="row.kwRow!.keyword"
                        :property-id="selectedPropertyId"
                        :source="row.kwRow!.source"
                      />
                    </ClientOnly>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>Page {{ paginationPage }} of {{ paginationTotalPages }}</span>
        <div class="flex gap-2">
          <button
            @click="prevPage"
            :disabled="paginationPage <= 1 || loading"
            class="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            @click="nextPage"
            :disabled="paginationPage >= paginationTotalPages || loading"
            class="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Property {
  _id: string
  propertyName: string
}

interface PageKeywordRow {
  page: string
  keyword: string
  source: 'specific_query' | 'bulk_discovery'
  latestPosition: number | null
  previousPosition: number | null
  positionChange: number | null
  latestDate: string | null
  previousDate: string | null
  latestClicks: number | null
  latestImpressions: number | null
}

interface PageStats {
  totalClicks: number | null
  totalImpressions: number | null
  avgCtr: number | null
  avgLatest: number | null
  avgPrevious: number | null
  medianChange: number | null
}

interface DisplayRow {
  type: 'page' | 'keyword' | 'chart'
  id: string
  pageUrl?: string
  keywords?: PageKeywordRow[]
  stats?: PageStats
  kwRow?: PageKeywordRow
}

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const rows = ref<PageKeywordRow[]>([])
const loading = ref(false)
const paginationPage = ref(1)
const PAGE_SIZE = 20

const collapsedPages = ref(new Set<string>())
const expandedKeywords = ref(new Set<string>())

const sortCol = ref<'page' | 'impressions' | 'clicks' | 'latest' | 'previous' | 'change' | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')

async function loadProperties() {
  const data = await $fetch<{ success: boolean; data: Property[] }>('/api/properties')
  properties.value = data.data || []
  if (properties.value.length === 1) {
    selectedPropertyId.value = properties.value[0]._id
  }
}

async function loadData() {
  if (!selectedPropertyId.value) return
  loading.value = true
  try {
    const result = await $fetch<{ success: boolean; data: PageKeywordRow[] }>(
      '/api/rankings/pages-summary',
      { query: { propertyId: selectedPropertyId.value } }
    )
    rows.value = result.data || []
    expandedKeywords.value = new Set()
    const pageUrls = new Set(rows.value.map((r) => r.page))
    collapsedPages.value = new Set([...pageUrls])
    paginationPage.value = 1
  } finally {
    loading.value = false
  }
}

watch(selectedPropertyId, loadData)

const pageNodes = computed(() => {
  const map = new Map<string, PageKeywordRow[]>()
  for (const r of rows.value) {
    if (!map.has(r.page)) map.set(r.page, [])
    map.get(r.page)!.push(r)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([page, keywords]) => ({ page, keywords }))
})

const totalPageCount = computed(() => pageNodes.value.length)
const totalKeywordCount = computed(() => rows.value.length)
const paginationTotalPages = computed(() => Math.max(1, Math.ceil(pageNodes.value.length / PAGE_SIZE)))

function setSort(col: 'page' | 'impressions' | 'clicks' | 'latest' | 'previous' | 'change') {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortCol.value = col
    sortDir.value = 'asc'
  }
  paginationPage.value = 1
}

function sortedPageNodes(nodes: { page: string; keywords: PageKeywordRow[] }[]) {
  const col = sortCol.value
  if (!col) return nodes
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...nodes].sort((a, b) => {
    if (col === 'page') return dir * pagePath(a.page).localeCompare(pagePath(b.page))
    const sa = computePageStats(a.keywords)
    const sb = computePageStats(b.keywords)
    switch (col) {
      case 'impressions': return dir * ((sa.totalImpressions ?? -1) - (sb.totalImpressions ?? -1))
      case 'clicks': return dir * ((sa.totalClicks ?? -1) - (sb.totalClicks ?? -1))
      case 'latest': return dir * ((sa.avgLatest ?? 999) - (sb.avgLatest ?? 999))
      case 'previous': return dir * ((sa.avgPrevious ?? 999) - (sb.avgPrevious ?? 999))
      case 'change': return dir * ((sa.medianChange ?? 0) - (sb.medianChange ?? 0))
      default: return 0
    }
  })
}

function sortedKeywordsInPage(kws: PageKeywordRow[]): PageKeywordRow[] {
  const col = sortCol.value
  if (!col) return kws
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...kws].sort((a, b) => {
    switch (col) {
      case 'page': return dir * a.keyword.localeCompare(b.keyword)
      case 'impressions': return dir * ((a.latestImpressions ?? -1) - (b.latestImpressions ?? -1))
      case 'clicks': return dir * ((a.latestClicks ?? -1) - (b.latestClicks ?? -1))
      case 'latest': return dir * ((a.latestPosition ?? 999) - (b.latestPosition ?? 999))
      case 'previous': return dir * ((a.previousPosition ?? 999) - (b.previousPosition ?? 999))
      case 'change': return dir * ((a.positionChange ?? 0) - (b.positionChange ?? 0))
      default: return 0
    }
  })
}

const pagedNodes = computed(() => {
  const skip = (paginationPage.value - 1) * PAGE_SIZE
  return sortedPageNodes(pageNodes.value).slice(skip, skip + PAGE_SIZE)
})

function computePageStats(keywords: PageKeywordRow[]): PageStats {
  let totalClicks = 0, hasClicks = false
  let totalImpressions = 0, hasImpressions = false
  let ctrClicks = 0, ctrImpressions = 0, hasCtr = false
  let latestSum = 0, latestCount = 0
  let prevSum = 0, prevCount = 0
  const changeVals: number[] = []

  for (const r of keywords) {
    if (r.latestClicks != null) { totalClicks += r.latestClicks; hasClicks = true }
    if (r.latestImpressions != null) { totalImpressions += r.latestImpressions; hasImpressions = true }
    if (r.latestImpressions != null && r.latestImpressions > 0) {
      ctrClicks += r.latestClicks ?? 0
      ctrImpressions += r.latestImpressions
      hasCtr = true
    }
    if (r.latestPosition != null) { latestSum += r.latestPosition; latestCount++ }
    if (r.previousPosition != null) { prevSum += r.previousPosition; prevCount++ }
    if (r.positionChange != null && r.positionChange !== 0) changeVals.push(r.positionChange)
  }

  let medianChange: number | null = null
  if (changeVals.length > 0) {
    changeVals.sort((a, b) => a - b)
    const mid = Math.floor(changeVals.length / 2)
    medianChange = changeVals.length % 2 === 0 ? (changeVals[mid - 1] + changeVals[mid]) / 2 : changeVals[mid]
  }

  return {
    totalClicks: hasClicks ? totalClicks : null,
    totalImpressions: hasImpressions ? totalImpressions : null,
    avgCtr: hasCtr ? (ctrClicks / ctrImpressions) * 100 : null,
    avgLatest: latestCount > 0 ? latestSum / latestCount : null,
    avgPrevious: prevCount > 0 ? prevSum / prevCount : null,
    medianChange,
  }
}

function kwKey(kw: PageKeywordRow): string {
  return `${kw.keyword}||${kw.page}`
}

const flatDisplayRows = computed<DisplayRow[]>(() => {
  const result: DisplayRow[] = []
  for (const node of pagedNodes.value) {
    const stats = computePageStats(node.keywords)
    result.push({ type: 'page', id: `page-${node.page}`, pageUrl: node.page, keywords: node.keywords, stats })
    if (collapsedPages.value.has(node.page)) continue
    for (const kw of sortedKeywordsInPage(node.keywords)) {
      result.push({ type: 'keyword', id: `kw-${kwKey(kw)}`, kwRow: kw })
      if (expandedKeywords.value.has(kwKey(kw))) {
        result.push({ type: 'chart', id: `chart-${kwKey(kw)}`, kwRow: kw })
      }
    }
  }
  return result
})

const latestDateLabel = computed(() => {
  const row = rows.value.find((r) => r.latestDate)
  if (!row?.latestDate) return 'Latest'
  return new Date(row.latestDate).toLocaleDateString()
})

const previousDateLabel = computed(() => {
  const row = rows.value.find((r) => r.previousDate)
  if (!row?.previousDate) return 'Previous'
  return new Date(row.previousDate).toLocaleDateString()
})

function pagePath(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

function togglePage(pageUrl: string) {
  const next = new Set(collapsedPages.value)
  if (next.has(pageUrl)) {
    next.delete(pageUrl)
  } else {
    next.add(pageUrl)
  }
  collapsedPages.value = next
}

function toggleKeyword(key: string) {
  const next = new Set(expandedKeywords.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  expandedKeywords.value = next
}

function prevPage() {
  if (paginationPage.value > 1) paginationPage.value--
}

function nextPage() {
  if (paginationPage.value < paginationTotalPages.value) paginationPage.value++
}

function changeClass(change: number | null) {
  if (change == null) return 'text-gray-400'
  if (change > 0) return 'text-green-600 font-medium'
  if (change < 0) return 'text-red-500 font-medium'
  return 'text-gray-400'
}

function formatChange(change: number | null) {
  if (change == null) return '—'
  if (change > 0) return `▲ ${change.toFixed(1)}`
  if (change < 0) return `▼ ${Math.abs(change).toFixed(1)}`
  return '—'
}

onMounted(loadProperties)
</script>
