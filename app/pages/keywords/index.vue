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
              <th class="px-3 py-2.5 text-left font-medium text-gray-700">Keyword / Group</th>
              <th class="px-3 py-2.5 text-left font-medium text-gray-700 w-8"></th>
              <th class="px-3 py-2.5 text-right font-medium text-gray-700 w-24">{{ latestDateLabel }}</th>
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
            <template v-else-if="groupedKeywords.length === 0">
              <tr>
                <td colspan="6" class="px-3 py-8 text-center text-gray-400">
                  No keywords tracked. Click "+ Add Keyword" to get started.
                </td>
              </tr>
            </template>
            <template v-else>
              <template v-for="group in groupedKeywords" :key="group.id">
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
                    <span class="mr-1 inline-block transition-transform" :class="collapsedGroups.has(group.id) ? '' : 'rotate-90'">▶</span>
                    {{ group.name }}
                    <span class="ml-2 text-xs text-gray-400 font-normal">{{ group.keywords.length }}</span>
                  </td>
                  <td class="px-3 py-2" />
                </tr>

                <!-- Keyword rows (if group not collapsed) -->
                <template v-if="!collapsedGroups.has(group.id)">
                  <template v-for="kw in group.keywords" :key="kw._id">
                    <!-- Keyword row -->
                    <tr
                      :class="[
                        'border-t border-gray-100 cursor-pointer hover:bg-slate-50',
                        expandedKeywords.has(kw._id) ? 'bg-slate-50' : 'bg-white',
                      ]"
                      @click="toggleKeyword(kw._id)"
                    >
                      <td class="px-3 py-2" @click.stop>
                        <input
                          type="checkbox"
                          :value="kw._id"
                          v-model="selectedIds"
                          class="cursor-pointer"
                        />
                      </td>
                      <td class="px-3 py-2 pl-8">
                        <span class="mr-1 text-gray-400 inline-block" :class="expandedKeywords.has(kw._id) ? 'rotate-90' : ''">▶</span>
                        {{ kw.keyword }}
                      </td>
                      <td class="px-3 py-2" @click.stop>
                        <PagesPopover
                          v-if="kw.latestPage"
                          :keyword="kw.keyword"
                          :property-id="selectedPropertyId"
                          source="specific_query"
                        />
                      </td>
                      <td class="px-3 py-2 text-right text-gray-800 tabular-nums">
                        {{ kw.latestPosition != null ? kw.latestPosition.toFixed(1) : '—' }}
                      </td>
                      <td class="px-3 py-2 text-right text-gray-500 tabular-nums">
                        {{ kw.previousPosition != null ? kw.previousPosition.toFixed(1) : '—' }}
                      </td>
                      <td class="px-3 py-2 text-right tabular-nums">
                        <span :class="changeClass(kw.positionChange)">
                          {{ formatChange(kw.positionChange) }}
                        </span>
                      </td>
                    </tr>

                    <!-- Chart row -->
                    <tr v-if="expandedKeywords.has(kw._id)" class="bg-slate-50 border-t border-gray-100">
                      <td colspan="6" class="p-0">
                        <ClientOnly>
                          <RankingChart
                            :keyword="kw.keyword"
                            :property-id="selectedPropertyId"
                            source="specific_query"
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
}

interface Keyword {
  _id: string
  keyword: string
  groupId: string | null
  latestPosition: number | null
  previousPosition: number | null
  latestPage: string | null
  latestDate: string | null
  positionChange: number | null
}

interface GroupedSection {
  id: string
  name: string
  keywords: Keyword[]
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
  } finally {
    loading.value = false
  }
}

watch(selectedPropertyId, loadData)

const groupedKeywords = computed<GroupedSection[]>(() => {
  const sections: GroupedSection[] = []
  const groupMap = new Map<string, GroupedSection>()

  for (const g of groups.value) {
    const section = { id: g._id, name: g.name, keywords: [] as Keyword[] }
    groupMap.set(g._id, section)
    sections.push(section)
  }

  const ungrouped: Keyword[] = []
  for (const kw of keywords.value) {
    const gid = kw.groupId as string
    if (gid && groupMap.has(gid)) {
      groupMap.get(gid)!.keywords.push(kw)
    } else {
      ungrouped.push(kw)
    }
  }

  if (ungrouped.length > 0) {
    sections.push({ id: '__ungrouped', name: 'Ungrouped', keywords: ungrouped })
  }

  return sections.filter((s) => s.keywords.length > 0)
})

const latestDateLabel = computed(() => {
  const kw = keywords.value.find((k) => k.latestDate)
  if (!kw?.latestDate) return 'Latest'
  return new Date(kw.latestDate).toLocaleDateString()
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

function isGroupChecked(group: GroupedSection) {
  return group.keywords.length > 0 && group.keywords.every((k) => selectedIds.value.includes(k._id))
}

function isGroupIndeterminate(group: GroupedSection) {
  return group.keywords.some((k) => selectedIds.value.includes(k._id)) && !isGroupChecked(group)
}

function toggleGroupCheck(group: GroupedSection) {
  if (isGroupChecked(group)) {
    selectedIds.value = selectedIds.value.filter((id) => !group.keywords.some((k) => k._id === id))
  } else {
    const toAdd = group.keywords.map((k) => k._id).filter((id) => !selectedIds.value.includes(id))
    selectedIds.value = [...selectedIds.value, ...toAdd]
  }
}

function toggleGroup(id: string) {
  if (collapsedGroups.value.has(id)) {
    collapsedGroups.value.delete(id)
  } else {
    collapsedGroups.value.add(id)
  }
}

function toggleKeyword(id: string) {
  if (expandedKeywords.value.has(id)) {
    expandedKeywords.value.delete(id)
  } else {
    expandedKeywords.value.add(id)
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
  groups.value.push(group as Group)
}

async function onMoved() {
  await loadData()
}

onMounted(loadProperties)
</script>
