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
        <div class="ml-auto text-sm text-gray-500">{{ pagination.total }} total terms</div>
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
              <th class="px-3 py-2.5 text-left font-medium text-gray-700">Search Term / Group</th>
              <th class="px-3 py-2.5 text-left font-medium text-gray-700 w-8"></th>
              <th class="px-3 py-2.5 text-right font-medium text-gray-700 w-24">Latest</th>
              <th class="px-3 py-2.5 text-right font-medium text-gray-700 w-24">Previous</th>
              <th class="px-3 py-2.5 text-right font-medium text-gray-700 w-20">Change</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr>
                <td colspan="6" class="px-3 py-8 text-center text-gray-400">Loading…</td>
              </tr>
            </template>
            <template v-else-if="groupedRows.length === 0">
              <tr>
                <td colspan="6" class="px-3 py-8 text-center text-gray-400">
                  No search terms found. Run a bulk pull from the
                  <NuxtLink to="/schedule" class="text-indigo-600 hover:underline">Schedule</NuxtLink> page.
                </td>
              </tr>
            </template>
            <template v-else>
              <template v-for="group in groupedRows" :key="group.id">
                <!-- Group header row -->
                <tr class="bg-gray-50 border-t border-gray-200 cursor-pointer hover:bg-gray-100" @click="toggleGroup(group.id)">
                  <td class="px-3 py-2">
                    <input
                      type="checkbox"
                      :checked="isGroupChecked(group)"
                      :indeterminate="isGroupIndeterminate(group)"
                      @change="toggleGroupCheck(group)"
                      @click.stop
                    />
                  </td>
                  <td class="px-3 py-2 font-medium text-gray-800" colspan="4">
                    <span class="mr-1 inline-block" :class="collapsedGroups.has(group.id) ? '' : 'rotate-90'">▶</span>
                    {{ group.name }}
                    <span class="ml-2 text-xs text-gray-400 font-normal">{{ group.rows.length }}</span>
                  </td>
                  <td class="px-3 py-2" />
                </tr>

                <!-- Search term rows -->
                <template v-if="!collapsedGroups.has(group.id)">
                  <template v-for="row in group.rows" :key="row.keyword">
                    <tr
                      :class="[
                        'border-t border-gray-100 cursor-pointer hover:bg-slate-50',
                        expandedTerms.has(row.keyword) ? 'bg-slate-50' : 'bg-white',
                      ]"
                      @click="toggleTerm(row.keyword)"
                    >
                      <td class="px-3 py-2" @click.stop>
                        <input
                          type="checkbox"
                          :value="row.keyword"
                          v-model="selectedKeywords"
                          class="cursor-pointer"
                        />
                      </td>
                      <td class="px-3 py-2 pl-8">
                        <span class="mr-1 text-gray-400" :class="expandedTerms.has(row.keyword) ? 'rotate-90' : ''">▶</span>
                        {{ row.keyword }}
                      </td>
                      <td class="px-3 py-2" @click.stop>
                        <PagesPopover
                          v-if="row.latestPage"
                          :keyword="row.keyword"
                          :property-id="selectedPropertyId"
                          source="bulk_discovery"
                        />
                      </td>
                      <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                        {{ row.latestPosition != null ? row.latestPosition.toFixed(1) : '—' }}
                      </td>
                      <td class="px-3 py-2 text-right text-gray-500 tabular-nums">
                        {{ row.previousPosition != null ? row.previousPosition.toFixed(1) : '—' }}
                      </td>
                      <td class="px-3 py-2 text-right tabular-nums">
                        <span :class="changeClass(row.positionChange)">
                          {{ formatChange(row.positionChange) }}
                        </span>
                      </td>
                    </tr>

                    <!-- Chart row -->
                    <tr v-if="expandedTerms.has(row.keyword)" class="bg-slate-50 border-t border-gray-100">
                      <td colspan="6" class="p-0">
                        <ClientOnly>
                          <RankingChart
                            :keyword="row.keyword"
                            :property-id="selectedPropertyId"
                            source="bulk_discovery"
                          />
                        </ClientOnly>
                      </td>
                    </tr>
                  </template>
                </template>
              </template>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>Page {{ pagination.page }} of {{ pagination.totalPages || 1 }}</span>
        <div class="flex gap-2">
          <button
            @click="prevPage"
            :disabled="pagination.page <= 1 || loading"
            class="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            @click="nextPage"
            :disabled="pagination.page >= pagination.totalPages || loading"
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
}

interface BulkRow {
  keyword: string
  latestPosition: number | null
  previousPosition: number | null
  positionChange: number | null
  latestPage: string | null
  latestDate: string | null
  groupId: string | null
}

interface GroupedSection {
  id: string
  name: string
  rows: BulkRow[]
}

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const rows = ref<BulkRow[]>([])
const groups = ref<Group[]>([])
const loading = ref(false)

const pagination = ref({ page: 1, pageSize: 50, total: 0, totalPages: 0 })

const selectedKeywords = ref<string[]>([])
const expandedTerms = ref(new Set<string>())
const collapsedGroups = ref(new Set<string>())

const showAddGroup = ref(false)
const showMoveToGroup = ref(false)

async function loadProperties() {
  const data = await $fetch<{ success: boolean; data: Property[] }>('/api/properties')
  properties.value = data.data || []
  if (properties.value.length === 1) {
    selectedPropertyId.value = properties.value[0]._id
  }
}

async function loadData(page = 1) {
  if (!selectedPropertyId.value) return
  loading.value = true
  try {
    const [summaryData, grpData] = await Promise.all([
      $fetch<{ success: boolean; data: BulkRow[]; pagination: typeof pagination.value }>(
        '/api/rankings/bulk-summary',
        { query: { propertyId: selectedPropertyId.value, page, pageSize: 50 } }
      ),
      $fetch<{ success: boolean; data: Group[] }>('/api/groups', {
        query: { propertyId: selectedPropertyId.value, type: 'bulk' },
      }),
    ])
    rows.value = summaryData.data || []
    pagination.value = summaryData.pagination
    groups.value = grpData.data || []
    selectedKeywords.value = []
    expandedTerms.value = new Set()
  } finally {
    loading.value = false
  }
}

watch(selectedPropertyId, () => {
  pagination.value.page = 1
  loadData(1)
})

function prevPage() {
  if (pagination.value.page > 1) loadData(pagination.value.page - 1)
}

function nextPage() {
  if (pagination.value.page < pagination.value.totalPages) loadData(pagination.value.page + 1)
}

const groupedRows = computed<GroupedSection[]>(() => {
  const sections: GroupedSection[] = []
  const groupMap = new Map<string, GroupedSection>()

  for (const g of groups.value) {
    const section = { id: g._id, name: g.name, rows: [] as BulkRow[] }
    groupMap.set(g._id, section)
    sections.push(section)
  }

  const ungrouped: BulkRow[] = []
  for (const row of rows.value) {
    const gid = row.groupId as string
    if (gid && groupMap.has(gid)) {
      groupMap.get(gid)!.rows.push(row)
    } else {
      ungrouped.push(row)
    }
  }

  if (ungrouped.length > 0) {
    sections.push({ id: '__ungrouped', name: 'Ungrouped', rows: ungrouped })
  }

  return sections.filter((s) => s.rows.length > 0)
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

function isGroupChecked(group: GroupedSection) {
  return group.rows.length > 0 && group.rows.every((r) => selectedKeywords.value.includes(r.keyword))
}

function isGroupIndeterminate(group: GroupedSection) {
  return group.rows.some((r) => selectedKeywords.value.includes(r.keyword)) && !isGroupChecked(group)
}

function toggleGroupCheck(group: GroupedSection) {
  if (isGroupChecked(group)) {
    selectedKeywords.value = selectedKeywords.value.filter((kw) => !group.rows.some((r) => r.keyword === kw))
  } else {
    const toAdd = group.rows.map((r) => r.keyword).filter((kw) => !selectedKeywords.value.includes(kw))
    selectedKeywords.value = [...selectedKeywords.value, ...toAdd]
  }
}

function toggleGroup(id: string) {
  if (collapsedGroups.value.has(id)) {
    collapsedGroups.value.delete(id)
  } else {
    collapsedGroups.value.add(id)
  }
}

function toggleTerm(keyword: string) {
  if (expandedTerms.value.has(keyword)) {
    expandedTerms.value.delete(keyword)
  } else {
    expandedTerms.value.add(keyword)
  }
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

async function onGroupCreated(group: unknown) {
  groups.value.push(group as Group)
}

async function onMoved() {
  await loadData(pagination.value.page)
}

onMounted(loadProperties)
</script>
