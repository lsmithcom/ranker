<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-gray-900">Search Terms</h1>

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
      <!-- Toolbar -->
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <button
          @click="showAddGroup = true"
          class="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          + Add Group
        </button>
        <button
          @click="showMoveToGroup = true"
          :disabled="selectedKeywords.length === 0"
          class="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Move to Group ({{ selectedKeywords.length }})
        </button>
        <div class="ml-auto text-sm text-gray-500">{{ totalKeywords }} total terms</div>
      </div>

      <!-- Table -->
      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="w-8 px-3 py-2.5 text-left">
                <input
                  type="checkbox"
                  :checked="allChecked"
                  :indeterminate="someChecked"
                  @change="toggleAll"
                  class="cursor-pointer"
                />
              </th>
              <th @click="setSort('keyword')" class="px-3 py-2.5 text-left font-medium text-gray-700 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap">
                Search Term / Group <span class="text-gray-400 text-xs">{{ sortCol === 'keyword' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}</span>
              </th>
              <th @click="setSort('impressions')" class="px-3 py-2.5 text-right font-medium text-gray-700 w-28 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap">
                Impressions <span class="text-gray-400 text-xs">{{ sortCol === 'impressions' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}</span>
              </th>
              <th class="px-3 py-2.5 text-right font-medium text-gray-700 w-20">CTR</th>
              <th @click="setSort('clicks')" class="px-3 py-2.5 text-right font-medium text-gray-700 w-24 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap">
                Clicks <span class="text-gray-400 text-xs">{{ sortCol === 'clicks' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}</span>
              </th>
              <th class="px-3 py-2.5 text-left font-medium text-gray-700 w-8">URL</th>
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
                <td colspan="9" class="px-3 py-8 text-center text-gray-400">Loading…</td>
              </tr>
            </template>
            <template v-else-if="flatDisplayRows.length === 0">
              <tr>
                <td colspan="9" class="px-3 py-8 text-center text-gray-400">
                  No search terms found. Run a bulk pull from the
                  <NuxtLink to="/schedule" class="text-indigo-600 hover:underline">Schedule</NuxtLink> page.
                </td>
              </tr>
            </template>
            <template v-else>
              <template v-for="row in flatDisplayRows" :key="row.id">
                <!-- Group header row -->
                <tr
                  v-if="row.type === 'group'"
                  class="bg-gray-50 border-t border-gray-200 cursor-pointer hover:bg-gray-100"
                  @click="toggleGroup(row.node!.id)"
                >
                  <td class="px-3 py-2">
                    <input
                      type="checkbox"
                      :checked="isGroupChecked(row.node!)"
                      :indeterminate="isGroupIndeterminate(row.node!)"
                      @change="toggleGroupCheck(row.node!)"
                      @click.stop
                    />
                  </td>
                  <td
                    class="py-2 font-medium text-gray-800"
                    :style="{ paddingLeft: `${row.depth * 20 + 12}px` }"
                  >
                    <span class="mr-1 inline-block" :class="collapsedGroups.has(row.node!.id) ? '' : 'rotate-90'">▶</span>
                    {{ row.node!.name }}
                    <span class="ml-2 text-xs text-gray-400 font-normal">{{ allDescendantKeywords(row.node!).length }}</span>
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
                  <td class="px-3 py-2" />
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

                <!-- Search term row -->
                <tr
                  v-else-if="row.type === 'term'"
                  :class="[
                    'border-t border-gray-100 cursor-pointer hover:bg-slate-50',
                    expandedTerms.has(row.termRow!.keyword) ? 'bg-slate-50' : 'bg-white',
                  ]"
                  @click="toggleTerm(row.termRow!.keyword)"
                >
                  <td class="px-3 py-2" @click.stop>
                    <input
                      type="checkbox"
                      :value="row.termRow!.keyword"
                      v-model="selectedKeywords"
                      class="cursor-pointer"
                    />
                  </td>
                  <td class="py-2" :style="{ paddingLeft: `${row.depth * 20 + 32}px` }">
                    <span class="mr-1 text-gray-400" :class="expandedTerms.has(row.termRow!.keyword) ? 'rotate-90' : ''">▶</span>
                    {{ row.termRow!.keyword }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                    {{ row.termRow!.latestImpressions != null ? row.termRow!.latestImpressions.toLocaleString() : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                    {{ row.termRow!.latestImpressions ? ((row.termRow!.latestClicks ?? 0) / row.termRow!.latestImpressions * 100).toFixed(2) + '%' : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                    {{ row.termRow!.latestClicks != null ? row.termRow!.latestClicks.toLocaleString() : '—' }}
                  </td>
                  <td class="px-3 py-2" @click.stop>
                    <PagesPopover
                      v-if="row.termRow!.latestPage"
                      :keyword="row.termRow!.keyword"
                      :property-id="selectedPropertyId"
                      source="bulk_discovery"
                    />
                  </td>
                  <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                    {{ row.termRow!.latestPosition != null ? row.termRow!.latestPosition.toFixed(1) : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-500 tabular-nums">
                    {{ row.termRow!.previousPosition != null ? row.termRow!.previousPosition.toFixed(1) : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right tabular-nums">
                    <span :class="changeClass(row.termRow!.positionChange)">
                      {{ formatChange(row.termRow!.positionChange) }}
                    </span>
                  </td>
                </tr>

                <!-- Chart row -->
                <tr v-else-if="row.type === 'chart'" class="bg-slate-50 border-t border-gray-100">
                  <td colspan="9" class="p-0">
                    <ClientOnly>
                      <RankingChart
                        :keyword="row.termRow!.keyword"
                        :property-id="selectedPropertyId"
                        source="bulk_discovery"
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
        <span>Page {{ groupPage }} of {{ groupTotalPages }}</span>
        <div class="flex gap-2">
          <button
            @click="prevPage"
            :disabled="groupPage <= 1 || loading"
            class="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            @click="nextPage"
            :disabled="groupPage >= groupTotalPages || loading"
            class="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <AddGroupModal
      v-if="showAddGroup"
      :property-id="selectedPropertyId"
      :groups="groups"
      type="bulk"
      @close="showAddGroup = false"
      @created="onGroupCreated"
    />
    <MoveToGroupModal
      v-if="showMoveToGroup"
      :selected-ids="[]"
      :selected-keywords="selectedKeywords"
      :groups="groups"
      type="bulk"
      :property-id="selectedPropertyId"
      @close="showMoveToGroup = false"
      @moved="onMoved"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Property {
  _id: string
  propertyName: string
}

interface Group {
  _id: string
  name: string
  parentId: string | null
}

interface BulkRow {
  keyword: string
  latestPosition: number | null
  previousPosition: number | null
  positionChange: number | null
  latestPage: string | null
  latestDate: string | null
  previousDate: string | null
  latestClicks: number | null
  latestImpressions: number | null
  groupId: string | null
}

interface TreeNode {
  id: string
  name: string
  parentId: string | null
  rows: BulkRow[]
  children: TreeNode[]
}

interface GroupStats {
  totalClicks: number | null
  totalImpressions: number | null
  avgCtr: number | null
  avgLatest: number | null
  avgPrevious: number | null
  medianChange: number | null
}

interface DisplayRow {
  type: 'group' | 'term' | 'chart'
  id: string
  depth: number
  node?: TreeNode
  termRow?: BulkRow
  stats?: GroupStats
}

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const rows = ref<BulkRow[]>([])
const groups = ref<Group[]>([])
const loading = ref(false)

const totalKeywords = ref(0)
const groupPage = ref(1)
const GROUP_PAGE_SIZE = 20

const selectedKeywords = ref<string[]>([])
const expandedTerms = ref(new Set<string>())
const collapsedGroups = ref(new Set<string>())

const showAddGroup = ref(false)
const showMoveToGroup = ref(false)

const sortCol = ref<'keyword' | 'impressions' | 'clicks' | 'latest' | 'previous' | 'change' | null>(null)
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
    const [summaryData, grpData] = await Promise.all([
      $fetch<{ success: boolean; data: BulkRow[]; pagination: { total: number } }>(
        '/api/rankings/bulk-summary',
        { query: { propertyId: selectedPropertyId.value, page: 1, pageSize: 5000 } }
      ),
      $fetch<{ success: boolean; data: Group[] }>('/api/groups', {
        query: { propertyId: selectedPropertyId.value, type: 'bulk' },
      }),
    ])
    rows.value = summaryData.data || []
    totalKeywords.value = summaryData.pagination.total
    groups.value = grpData.data || []
    selectedKeywords.value = []
    expandedTerms.value = new Set()
    // Start with all groups collapsed
    collapsedGroups.value = new Set([...groups.value.map((g) => g._id), '__ungrouped'])
    groupPage.value = 1
  } finally {
    loading.value = false
  }
}

watch(selectedPropertyId, () => {
  loadData()
})

function prevPage() {
  if (groupPage.value > 1) groupPage.value--
}

function nextPage() {
  if (groupPage.value < groupTotalPages.value) groupPage.value++
}

const groupTree = computed<TreeNode[]>(() => {
  const nodeMap = new Map<string, TreeNode>()

  for (const g of groups.value) {
    nodeMap.set(g._id, { id: g._id, name: g.name, parentId: g.parentId, rows: [], children: [] })
  }

  const ungroupedRows: BulkRow[] = []
  for (const row of rows.value) {
    if (row.groupId && nodeMap.has(row.groupId)) {
      nodeMap.get(row.groupId)!.rows.push(row)
    } else {
      ungroupedRows.push(row)
    }
  }

  const roots: TreeNode[] = []
  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  if (ungroupedRows.length > 0) {
    roots.push({ id: '__ungrouped', name: 'Ungrouped', parentId: null, rows: ungroupedRows, children: [] })
  }

  return roots
})

function collectAllTermRows(node: TreeNode): BulkRow[] {
  const all: BulkRow[] = [...node.rows]
  for (const child of node.children) {
    all.push(...collectAllTermRows(child))
  }
  return all
}

function allDescendantKeywords(node: TreeNode): string[] {
  return collectAllTermRows(node).map((r) => r.keyword)
}

function computeGroupStats(node: TreeNode): GroupStats {
  const all = collectAllTermRows(node)

  let totalClicks = 0, hasClicks = false
  let totalImpressions = 0, hasImpressions = false
  let ctrClicks = 0, ctrImpressions = 0, hasCtr = false
  let latestSum = 0, latestCount = 0
  let prevSum = 0, prevCount = 0
  const changeVals: number[] = []

  for (const r of all) {
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

function setSort(col: 'keyword' | 'impressions' | 'clicks' | 'latest' | 'previous' | 'change') {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortCol.value = col
    sortDir.value = 'asc'
  }
}

function sortedRows(rows: BulkRow[]): BulkRow[] {
  const col = sortCol.value
  if (!col) return rows
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    switch (col) {
      case 'keyword': return dir * a.keyword.localeCompare(b.keyword)
      case 'impressions': return dir * ((a.latestImpressions ?? -1) - (b.latestImpressions ?? -1))
      case 'clicks': return dir * ((a.latestClicks ?? -1) - (b.latestClicks ?? -1))
      case 'latest': return dir * ((a.latestPosition ?? 999) - (b.latestPosition ?? 999))
      case 'previous': return dir * ((a.previousPosition ?? 999) - (b.previousPosition ?? 999))
      case 'change': return dir * ((a.positionChange ?? 0) - (b.positionChange ?? 0))
      default: return 0
    }
  })
}

function flattenNode(node: TreeNode, depth: number, result: DisplayRow[]) {
  const stats = computeGroupStats(node)
  result.push({ type: 'group', id: `group-${node.id}`, depth, node, stats })
  if (collapsedGroups.value.has(node.id)) return
  // Subgroups before individual terms
  for (const child of node.children) {
    flattenNode(child, depth + 1, result)
  }
  for (const row of sortedRows(node.rows)) {
    result.push({ type: 'term', id: `term-${row.keyword}`, depth, termRow: row })
    if (expandedTerms.value.has(row.keyword)) {
      result.push({ type: 'chart', id: `chart-${row.keyword}`, depth, termRow: row })
    }
  }
}

// Pagination: paginate over root-level nodes only
const groupTotalPages = computed(() => Math.max(1, Math.ceil(groupTree.value.length / GROUP_PAGE_SIZE)))

const pagedRoots = computed(() => {
  const skip = (groupPage.value - 1) * GROUP_PAGE_SIZE
  return groupTree.value.slice(skip, skip + GROUP_PAGE_SIZE)
})

const flatDisplayRows = computed<DisplayRow[]>(() => {
  const result: DisplayRow[] = []
  for (const node of pagedRoots.value) {
    flattenNode(node, 0, result)
  }
  return result
})

const allKeywords = computed(() => rows.value.map((r) => r.keyword))
const allChecked = computed(() => allKeywords.value.length > 0 && selectedKeywords.value.length === allKeywords.value.length)
const someChecked = computed(() => selectedKeywords.value.length > 0 && selectedKeywords.value.length < allKeywords.value.length)

function toggleAll() {
  if (allChecked.value) {
    selectedKeywords.value = []
  } else {
    selectedKeywords.value = [...allKeywords.value]
  }
}

function isGroupChecked(node: TreeNode) {
  const keywords = allDescendantKeywords(node)
  return keywords.length > 0 && keywords.every((kw) => selectedKeywords.value.includes(kw))
}

function isGroupIndeterminate(node: TreeNode) {
  const keywords = allDescendantKeywords(node)
  return keywords.some((kw) => selectedKeywords.value.includes(kw)) && !isGroupChecked(node)
}

function toggleGroupCheck(node: TreeNode) {
  const keywords = allDescendantKeywords(node)
  if (isGroupChecked(node)) {
    selectedKeywords.value = selectedKeywords.value.filter((kw) => !keywords.includes(kw))
  } else {
    const toAdd = keywords.filter((kw) => !selectedKeywords.value.includes(kw))
    selectedKeywords.value = [...selectedKeywords.value, ...toAdd]
  }
}

function toggleGroup(id: string) {
  const next = new Set(collapsedGroups.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  collapsedGroups.value = next
}

function toggleTerm(keyword: string) {
  const next = new Set(expandedTerms.value)
  if (next.has(keyword)) {
    next.delete(keyword)
  } else {
    next.add(keyword)
  }
  expandedTerms.value = next
}

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

async function onGroupCreated(group: unknown) {
  const g = group as Group
  groups.value.push(g)
  collapsedGroups.value = new Set([...collapsedGroups.value, g._id])
}

async function onMoved() {
  await loadData()
}

onMounted(loadProperties)
</script>
