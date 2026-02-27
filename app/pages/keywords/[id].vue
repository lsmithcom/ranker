<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <NuxtLink to="/dashboard" class="text-sm text-gray-500 hover:text-gray-800">&larr; Back to Dashboard</NuxtLink>
    </div>

    <div v-if="loading" class="text-sm text-gray-400">Loading...</div>

    <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>

    <div v-else>
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-xl font-bold text-gray-900">{{ keyword }}</h1>
          <p class="text-sm text-gray-400 mt-1">Historical ranking data</p>
        </div>
        <div v-if="rankings.length" class="text-right">
          <div class="text-2xl font-bold text-gray-900">{{ latestPosition }}</div>
          <div class="text-xs text-gray-400">Current position</div>
        </div>
      </div>

      <!-- Summary stats -->
      <div v-if="rankings.length" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-white border border-gray-200 rounded p-4">
          <div class="text-xs text-gray-400 mb-1">Avg Position (30d)</div>
          <div class="text-xl font-bold text-gray-800">{{ avgPosition }}</div>
        </div>
        <div class="bg-white border border-gray-200 rounded p-4">
          <div class="text-xs text-gray-400 mb-1">Total Clicks</div>
          <div class="text-xl font-bold text-gray-800">{{ totalClicks.toLocaleString() }}</div>
        </div>
        <div class="bg-white border border-gray-200 rounded p-4">
          <div class="text-xs text-gray-400 mb-1">Total Impressions</div>
          <div class="text-xl font-bold text-gray-800">{{ totalImpressions.toLocaleString() }}</div>
        </div>
        <div class="bg-white border border-gray-200 rounded p-4">
          <div class="text-xs text-gray-400 mb-1">Avg CTR</div>
          <div class="text-xl font-bold text-gray-800">{{ avgCtr }}%</div>
        </div>
      </div>

      <!-- Rankings table -->
      <div v-if="!rankings.length" class="bg-white border border-gray-200 rounded p-8 text-center text-sm text-gray-400">
        No ranking data yet. Run a GSC query to populate data for this keyword.
      </div>

      <div v-else class="bg-white border border-gray-200 rounded overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
              <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Page</th>
              <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Position</th>
              <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Clicks</th>
              <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Impressions</th>
              <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">CTR</th>
              <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Source</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="r in rankings" :key="r._id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-600">{{ formatDate(r.date) }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs truncate max-w-xs">{{ r.page || '—' }}</td>
              <td class="px-4 py-3 text-right font-mono text-gray-700">{{ r.position?.toFixed(1) ?? '—' }}</td>
              <td class="px-4 py-3 text-right text-gray-600">{{ r.clicks ?? '—' }}</td>
              <td class="px-4 py-3 text-right text-gray-600">{{ r.impressions?.toLocaleString() ?? '—' }}</td>
              <td class="px-4 py-3 text-right text-gray-600">{{ r.ctr != null ? (r.ctr * 100).toFixed(2) + '%' : '—' }}</td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-400">{{ r.source === 'specific_query' ? 'Tracked' : 'Discovered' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Ranking {
  _id: string
  keyword: string
  page: string | null
  position: number | null
  clicks: number | null
  impressions: number | null
  ctr: number | null
  date: string
  source: string
}

const route = useRoute()
const id = route.params.id as string

const rankings = ref<Ranking[]>([])
const keyword = ref('')
const loading = ref(true)
const error = ref('')

const latestPosition = computed(() => {
  const r = rankings.value[0]
  return r?.position != null ? r.position.toFixed(1) : '—'
})

const avgPosition = computed(() => {
  const valid = rankings.value.filter(r => r.position != null)
  if (!valid.length) return '—'
  const avg = valid.reduce((s, r) => s + r.position!, 0) / valid.length
  return avg.toFixed(1)
})

const totalClicks = computed(() => rankings.value.reduce((s, r) => s + (r.clicks ?? 0), 0))
const totalImpressions = computed(() => rankings.value.reduce((s, r) => s + (r.impressions ?? 0), 0))

const avgCtr = computed(() => {
  const valid = rankings.value.filter(r => r.ctr != null)
  if (!valid.length) return '—'
  const avg = valid.reduce((s, r) => s + r.ctr!, 0) / valid.length
  return (avg * 100).toFixed(2)
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString()
}

onMounted(async () => {
  try {
    const res = await $fetch<{ data: Ranking[] }>(`/api/rankings/${id}`)
    rankings.value = res.data
    if (rankings.value.length) {
      keyword.value = rankings.value[0].keyword
    }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    error.value = e?.data?.message || e?.message || 'Failed to load ranking data'
  } finally {
    loading.value = false
  }
})
</script>
