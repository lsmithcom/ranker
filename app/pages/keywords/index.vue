<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-gray-900">Tracked Keywords</h1>

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
          @click="showAddKeyword = true"
          class="text-sm px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors"
        >
          + Add Keyword
        </button>
        <button
          @click="showAddGroup = true"
          class="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          + Add Group
        </button>
        <button
          @click="showMoveToGroup = true"
          :disabled="selectedIds.length === 0"
          class="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Move to Group
        </button>
        <button
          @click="deleteSelected"
          :disabled="selectedIds.length === 0 || deleting"
          class="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {{ deleting ? 'Deleting…' : `Delete Selected (${selectedIds.length})` }}
        </button>
        <div class="ml-auto text-sm text-gray-500">{{ keywords.length }} keyword(s)</div>
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
                Keyword / Group <span class="text-gray-400 text-xs">{{ sortCol === 'keyword' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}</span>
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
                  No keywords tracked. Click "+ Add Keyword" to get started.
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
                    <span class="mr-1 inline-block transition-transform" :class="collapsedGroups.has(row.node!.id) ? '' : 'rotate-90'">▶</span>
                    {{ row.node!.name }}
                    <span class="ml-2 text-xs text-gray-400 font-normal">{{ allDescendantKeywordIds(row.node!).length }}</span>
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

                <!-- Keyword row -->
                <tr
                  v-else-if="row.type === 'keyword'"
                  :class="[
                    'border-t border-gray-100 cursor-pointer hover:bg-slate-50',
                    expandedKeywords.has(row.kw!._id) ? 'bg-slate-50' : 'bg-white',
                  ]"
                  @click="toggleKeyword(row.kw!._id)"
                >
                  <td class="px-3 py-2" @click.stop>
                    <input
                      type="checkbox"
                      :value="row.kw!._id"
                      v-model="selectedIds"
                      class="cursor-pointer"
                    />
                  </td>
                  <td class="py-2" :style="{ paddingLeft: `${row.depth * 20 + 32}px` }">
                    <span class="mr-1 text-gray-400 inline-block" :class="expandedKeywords.has(row.kw!._id) ? 'rotate-90' : ''">▶</span>
                    {{ row.kw!.keyword }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                    {{ row.kw!.latestImpressions != null ? row.kw!.latestImpressions.toLocaleString() : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                    {{ row.kw!.latestImpressions ? ((row.kw!.latestClicks ?? 0) / row.kw!.latestImpressions * 100).toFixed(2) + '%' : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                    {{ row.kw!.latestClicks != null ? row.kw!.latestClicks.toLocaleString() : '—' }}
                  </td>
                  <td class="px-3 py-2" @click.stop>
                    <PagesPopover
                      v-if="row.kw!.latestPage"
                      :keyword="row.kw!.keyword"
                      :property-id="selectedPropertyId"
                      source="specific_query"
                    />
                  </td>
                  <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                    {{ row.kw!.latestPosition != null ? row.kw!.latestPosition.toFixed(1) : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-500 tabular-nums">
                    {{ row.kw!.previousPosition != null ? row.kw!.previousPosition.toFixed(1) : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right tabular-nums">
                    <span :class="changeClass(row.kw!.positionChange)">
                      {{ formatChange(row.kw!.positionChange) }}
                    </span>
                  </td>
                </tr>

                <!-- Chart row -->
                <tr v-else-if="row.type === 'chart'" class="bg-slate-50 border-t border-gray-100">
                  <td colspan="9" class="p-0">
                    <ClientOnly>
                      <RankingChart
                        :keyword="row.kw!.keyword"
                        :property-id="selectedPropertyId"
                        source="specific_query"
                      />
                    </ClientOnly>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Modals -->
    <AddKeywordModal
      v-if="showAddKeyword"
      :property-id="selectedPropertyId"
      :groups="groups"
      @close="showAddKeyword = false"
      @added="onKeywordAdded"
    />
    <AddGroupModal
      v-if="showAddGroup"
      :property-id="selectedPropertyId"
      :groups="groups"
      type="tracked"
      @close="showAddGroup = false"
      @created="onGroupCreated"
    />
    <MoveToGroupModal
      v-if="showMoveToGroup"
      :selected-ids="selectedIds"
      :groups="groups"
      type="tracked"
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

interface Keyword {
  _id: string
  keyword: string
  groupId: string | null
  latestPosition: number | null
  previousPosition: number | null
  latestClicks: number | null
  latestImpressions: number | null
  latestPage: string | null
  latestDate: string | null
  previousDate: string | null
  positionChange: number | null
}

interface TreeNode {
  id: string
  name: string
  parentId: string | null
  keywords: Keyword[]
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
  type: 'group' | 'keyword' | 'chart'
  id: string
  depth: number
  node?: TreeNode
  kw?: Keyword
  stats?: GroupStats
}

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const keywords = ref<Keyword[]>([])
const groups = ref<Group[]>([])
const loading = ref(false)

const selectedIds = ref<string[]>([])
const expandedKeywords = ref(new Set<string>())
const collapsedGroups = ref(new Set<string>())

const showAddKeyword = ref(false)
const showAddGroup = ref(false)
const showMoveToGroup = ref(false)
const deleting = ref(false)

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
    const [kwData, grpData] = await Promise.all([
      $fetch<{ success: boolean; data: Keyword[] }>('/api/keywords', {
        query: { propertyId: selectedPropertyId.value },
      }),
      $fetch<{ success: boolean; data: Group[] }>('/api/groups', {
        query: { propertyId: selectedPropertyId.value, type: 'tracked' },
      }),
    ])
    keywords.value = kwData.data || []
    groups.value = grpData.data || []
    selectedIds.value = []
    expandedKeywords.value = new Set()
    // Start with all groups collapsed
    collapsedGroups.value = new Set([...groups.value.map((g) => g._id), '__ungrouped'])
  } finally {
    loading.value = false
  }
}

watch(selectedPropertyId, loadData)

const groupTree = computed<TreeNode[]>(() => {
  const nodeMap = new Map<string, TreeNode>()

  for (const g of groups.value) {
    nodeMap.set(g._id, { id: g._id, name: g.name, parentId: g.parentId, keywords: [], children: [] })
  }

  const ungroupedKws: Keyword[] = []
  for (const kw of keywords.value) {
    if (kw.groupId && nodeMap.has(kw.groupId)) {
      nodeMap.get(kw.groupId)!.keywords.push(kw)
    } else {
      ungroupedKws.push(kw)
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

  if (ungroupedKws.length > 0) {
    roots.push({ id: '__ungrouped', name: 'Ungrouped', parentId: null, keywords: ungroupedKws, children: [] })
  }

  return roots
})

function collectAllKeywords(node: TreeNode): Keyword[] {
  const all: Keyword[] = [...node.keywords]
  for (const child of node.children) {
    all.push(...collectAllKeywords(child))
  }
  return all
}

function allDescendantKeywordIds(node: TreeNode): string[] {
  return collectAllKeywords(node).map((k) => k._id)
}

function computeGroupStats(node: TreeNode): GroupStats {
  const all = collectAllKeywords(node)

  let totalClicks = 0, hasClicks = false
  let totalImpressions = 0, hasImpressions = false
  let ctrClicks = 0, ctrImpressions = 0, hasCtr = false
  let latestSum = 0, latestCount = 0
  let prevSum = 0, prevCount = 0
  const changeVals: number[] = []

  for (const k of all) {
    if (k.latestClicks != null) { totalClicks += k.latestClicks; hasClicks = true }
    if (k.latestImpressions != null) { totalImpressions += k.latestImpressions; hasImpressions = true }
    if (k.latestImpressions != null && k.latestImpressions > 0) {
      ctrClicks += k.latestClicks ?? 0
      ctrImpressions += k.latestImpressions
      hasCtr = true
    }
    if (k.latestPosition != null) { latestSum += k.latestPosition; latestCount++ }
    if (k.previousPosition != null) { prevSum += k.previousPosition; prevCount++ }
    if (k.positionChange != null && k.positionChange !== 0) changeVals.push(k.positionChange)
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

function flattenNode(node: TreeNode, depth: number, rows: DisplayRow[]) {
  const stats = computeGroupStats(node)
  rows.push({ type: 'group', id: `group-${node.id}`, depth, node, stats })
  if (collapsedGroups.value.has(node.id)) return
  // Subgroups before keywords
  for (const child of node.children) {
    flattenNode(child, depth + 1, rows)
  }
  for (const kw of sortedKeywords(node.keywords)) {
    rows.push({ type: 'keyword', id: `kw-${kw._id}`, depth, kw })
    if (expandedKeywords.value.has(kw._id)) {
      rows.push({ type: 'chart', id: `chart-${kw._id}`, depth, kw })
    }
  }
}

const flatDisplayRows = computed<DisplayRow[]>(() => {
  const rows: DisplayRow[] = []
  for (const node of groupTree.value) {
    flattenNode(node, 0, rows)
  }
  return rows
})

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

const latestDateLabel = computed(() => {
  const kw = keywords.value.find((k) => k.latestDate)
  if (!kw?.latestDate) return 'Latest'
  return parseDateLocal(kw.latestDate).toLocaleDateString()
})

const previousDateLabel = computed(() => {
  const kw = keywords.value.find((k) => k.previousDate)
  if (!kw?.previousDate) return 'Previous'
  return parseDateLocal(kw.previousDate).toLocaleDateString()
})

const allChecked = computed(() => keywords.value.length > 0 && selectedIds.value.length === keywords.value.length)
const someChecked = computed(() => selectedIds.value.length > 0 && selectedIds.value.length < keywords.value.length)

function toggleAll() {
  if (allChecked.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = keywords.value.map((k) => k._id)
  }
}

function isGroupChecked(node: TreeNode) {
  const ids = allDescendantKeywordIds(node)
  return ids.length > 0 && ids.every((id) => selectedIds.value.includes(id))
}

function isGroupIndeterminate(node: TreeNode) {
  const ids = allDescendantKeywordIds(node)
  return ids.some((id) => selectedIds.value.includes(id)) && !isGroupChecked(node)
}

function toggleGroupCheck(node: TreeNode) {
  const ids = allDescendantKeywordIds(node)
  if (isGroupChecked(node)) {
    selectedIds.value = selectedIds.value.filter((id) => !ids.includes(id))
  } else {
    const toAdd = ids.filter((id) => !selectedIds.value.includes(id))
    selectedIds.value = [...selectedIds.value, ...toAdd]
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

function toggleKeyword(id: string) {
  const next = new Set(expandedKeywords.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  expandedKeywords.value = next
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

function setSort(col: 'keyword' | 'impressions' | 'clicks' | 'latest' | 'previous' | 'change') {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortCol.value = col
    sortDir.value = 'asc'
  }
}

function sortedKeywords(kws: Keyword[]): Keyword[] {
  const col = sortCol.value
  if (!col) return kws
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...kws].sort((a, b) => {
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

async function deleteSelected() {
  if (!confirm(`Delete ${selectedIds.value.length} keyword(s)? This cannot be undone.`)) return
  deleting.value = true
  try {
    await $fetch('/api/keywords/bulk-delete', {
      method: 'POST',
      body: { ids: selectedIds.value },
    })
    await loadData()
  } finally {
    deleting.value = false
  }
}

async function onKeywordAdded(kw: unknown) {
  keywords.value.push(kw as Keyword)
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
