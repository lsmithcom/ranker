<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-gray-900">Manage Keywords</h1>
      <NuxtLink
        to="/keywords"
        class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        ← Back to Keywords
      </NuxtLink>
    </div>

    <!-- Property selector -->
    <div class="mb-6">
      <label class="block text-xs text-gray-500 mb-1">Property</label>
      <select
        v-model="selectedPropertyId"
        class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 min-w-64"
      >
        <option value="">Select a property…</option>
        <option v-for="p in properties" :key="p._id" :value="p._id">{{ p.propertyName }}</option>
      </select>
    </div>

    <template v-if="selectedPropertyId">
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-gray-700">Tracked Keywords</h2>
        <button
          @click="showAddKeyword = !showAddKeyword"
          class="text-sm bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700 transition-colors"
        >
          Add Keyword
        </button>
      </div>

      <!-- Add keyword form -->
      <div v-if="showAddKeyword" class="bg-white border border-gray-200 rounded p-4 mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Keyword</label>
            <input
              v-model="newKeyword.keyword"
              type="text"
              placeholder="best running shoes"
              class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Priority</label>
            <select
              v-model="newKeyword.priority"
              class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Target Page (optional)</label>
            <input
              v-model="newKeyword.targetPage"
              type="text"
              placeholder="https://example.com/page"
              class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button
            @click="addKeyword"
            :disabled="addingKeyword"
            class="text-sm bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {{ addingKeyword ? 'Adding...' : 'Add Keyword' }}
          </button>
          <button
            @click="showAddKeyword = false"
            class="text-sm border border-gray-300 px-4 py-1.5 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
        <p v-if="keywordError" class="text-xs text-red-600 mt-2">{{ keywordError }}</p>
      </div>

      <!-- Keywords table -->
      <div v-if="keywordsLoading" class="text-sm text-gray-400">Loading keywords...</div>
      <div
        v-else-if="!keywords.length"
        class="text-sm text-gray-400 bg-white border border-gray-200 rounded p-6 text-center"
      >
        No keywords tracked yet. Add your first keyword above.
      </div>
      <div v-else class="bg-white border border-gray-200 rounded overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Keyword</th>
              <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</th>
              <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Position</th>
              <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Change</th>
              <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Clicks</th>
              <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Impressions</th>
              <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Last Data</th>
              <th class="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="kw in keywords" :key="kw._id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <NuxtLink
                  :to="`/keywords/${kw._id}`"
                  class="font-medium text-gray-800 hover:text-blue-600 hover:underline"
                >
                  {{ kw.keyword }}
                </NuxtLink>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="{
                    'text-red-600 bg-red-50': kw.priority === 'high',
                    'text-yellow-600 bg-yellow-50': kw.priority === 'medium',
                    'text-gray-500 bg-gray-50': kw.priority === 'low',
                  }"
                  class="text-xs px-2 py-0.5 rounded font-medium"
                >
                  {{ kw.priority }}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-gray-700 font-mono">
                {{ kw.latestPosition != null ? kw.latestPosition.toFixed(1) : '—' }}
              </td>
              <td class="px-4 py-3 text-right font-mono text-xs">
                <span
                  v-if="kw.positionChange != null"
                  :class="kw.positionChange > 0 ? 'text-emerald-600' : kw.positionChange < 0 ? 'text-rose-500' : 'text-gray-400'"
                >
                  {{ kw.positionChange > 0 ? '▲' : kw.positionChange < 0 ? '▼' : '—' }}
                  {{ Math.abs(kw.positionChange).toFixed(1) }}
                </span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-4 py-3 text-right text-gray-600">{{ kw.latestClicks ?? '—' }}</td>
              <td class="px-4 py-3 text-right text-gray-600">{{ kw.latestImpressions?.toLocaleString() ?? '—' }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ kw.latestDate ? formatDate(kw.latestDate) : '—' }}</td>
              <td class="px-4 py-3 text-right">
                <button
                  @click="deleteKeyword(kw._id)"
                  class="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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

interface Keyword {
  _id: string
  keyword: string
  priority: string
  latestPosition: number | null
  latestClicks: number | null
  latestImpressions: number | null
  latestDate: string | null
  positionChange: number | null
}

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const keywords = ref<Keyword[]>([])
const keywordsLoading = ref(false)
const showAddKeyword = ref(false)
const addingKeyword = ref(false)
const keywordError = ref('')
const newKeyword = reactive({ keyword: '', priority: 'medium', targetPage: '' })

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

async function loadProperties() {
  try {
    const res = await $fetch<{ data: Property[] }>('/api/properties')
    properties.value = res.data
    if (properties.value.length === 1) {
      selectedPropertyId.value = properties.value[0]._id
    }
  } catch {
    // silent
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

async function addKeyword() {
  keywordError.value = ''
  addingKeyword.value = true
  try {
    await $fetch('/api/keywords', {
      method: 'POST',
      body: {
        propertyId: selectedPropertyId.value,
        keyword: newKeyword.keyword,
        priority: newKeyword.priority,
        targetPage: newKeyword.targetPage || undefined,
      },
    })
    Object.assign(newKeyword, { keyword: '', priority: 'medium', targetPage: '' })
    showAddKeyword.value = false
    await loadKeywords()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    keywordError.value = e?.data?.message || 'Failed to add keyword'
  } finally {
    addingKeyword.value = false
  }
}

async function deleteKeyword(id: string) {
  if (!confirm('Remove this keyword from tracking?')) return
  try {
    await $fetch(`/api/keywords/${id}`, { method: 'DELETE' })
    keywords.value = keywords.value.filter((k) => k._id !== id)
  } catch {
    alert('Failed to remove keyword')
  }
}

watch(selectedPropertyId, () => {
  keywords.value = []
  loadKeywords()
})

onMounted(loadProperties)
</script>
