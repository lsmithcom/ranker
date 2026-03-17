<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-xl font-semibold text-gray-900 mb-6">Pull Schedule</h1>

    <!-- Property selector -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">Property</label>
      <select
        v-model="selectedPropertyId"
        class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 min-w-64"
      >
        <option value="">Select a property…</option>
        <option v-for="p in properties" :key="p._id" :value="p._id">{{ p.propertyName }}</option>
      </select>
    </div>

    <template v-if="selectedProperty">
      <!-- Dual status cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <!-- GSC status -->
        <div class="bg-white shadow-sm rounded-lg p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-700">Search Console</span>
            <span
              :class="[
                'text-xs px-2 py-0.5 rounded-full font-medium',
                selectedProperty.pullSchedule?.isScheduled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500',
              ]"
            >
              {{ selectedProperty.pullSchedule?.isScheduled ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <dl class="grid grid-cols-1 gap-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500">Frequency</dt>
              <dd class="font-medium capitalize">{{ selectedProperty.pullSchedule?.frequency || '—' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Pull Hour</dt>
              <dd class="font-medium">{{ formatPullHour(selectedProperty.pullSchedule?.pullHour) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Last Pulled</dt>
              <dd class="font-medium">{{ formatDate(selectedProperty.lastPulledAt) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Next Pull</dt>
              <dd class="font-medium">{{ formatDate(selectedProperty.pullSchedule?.nextPullAt) }}</dd>
            </div>
          </dl>
        </div>

        <!-- GA4 status -->
        <div class="bg-white shadow-sm rounded-lg p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-700">Google Analytics</span>
            <span
              :class="[
                'text-xs px-2 py-0.5 rounded-full font-medium',
                selectedProperty.ga4PullSchedule?.isScheduled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500',
              ]"
            >
              {{ selectedProperty.ga4PullSchedule?.isScheduled ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <dl class="grid grid-cols-1 gap-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500">Frequency</dt>
              <dd class="font-medium capitalize">{{ selectedProperty.ga4PullSchedule?.frequency || '—' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Pull Hour</dt>
              <dd class="font-medium">{{ formatPullHour(selectedProperty.ga4PullSchedule?.pullHour) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Last Pulled</dt>
              <dd class="font-medium">{{ formatDate(selectedProperty.ga4LastPulledAt) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Next Pull</dt>
              <dd class="font-medium">{{ formatDate(selectedProperty.ga4PullSchedule?.nextPullAt) }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Configure Schedule -->
      <div class="bg-white shadow-sm rounded-lg p-5 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900">Configure Schedule</h2>
          <!-- Toggle tabs -->
          <div class="flex rounded-md border border-gray-200 overflow-hidden text-xs font-medium">
            <button
              type="button"
              @click="activeTab = 'gsc'"
              :class="[
                'px-3 py-1.5 transition-colors',
                activeTab === 'gsc'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50',
              ]"
            >
              Search Console
            </button>
            <button
              type="button"
              @click="activeTab = 'ga4'"
              :class="[
                'px-3 py-1.5 border-l border-gray-200 transition-colors',
                activeTab === 'ga4'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50',
              ]"
            >
              Google Analytics
            </button>
          </div>
        </div>

        <!-- GSC form -->
        <form v-if="activeTab === 'gsc'" @submit.prevent="saveGscSchedule" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <div class="flex gap-4">
              <label v-for="opt in frequencies" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="gscForm.frequency" :value="opt.value" class="text-gray-900" />
                <span class="text-sm">{{ opt.label }}</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              v-model="gscForm.startDate"
              type="date"
              class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Pull Hour (Pacific Time)</label>
            <select
              v-model="gscForm.pullHour"
              class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            >
              <option v-for="h in 24" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00 PT</option>
            </select>
          </div>
          <div v-if="gscSaveError" class="text-sm text-red-600">{{ gscSaveError }}</div>
          <div v-if="gscSaveSuccess" class="text-sm text-green-600">GSC schedule saved successfully.</div>
          <div class="flex gap-3 pt-1">
            <button
              type="submit"
              :disabled="saving"
              class="text-sm px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {{ saving ? 'Saving…' : 'Save Schedule' }}
            </button>
            <button
              type="button"
              @click="disableGscSchedule"
              :disabled="saving"
              class="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Disable Schedule
            </button>
          </div>
        </form>

        <!-- GA4 form -->
        <form v-else @submit.prevent="saveGa4Schedule" class="space-y-4">
          <p v-if="!selectedProperty.ga4PropertyId" class="text-sm text-amber-600">
            No GA4 Property ID is set for this property. Configure it in
            <NuxtLink to="/settings" class="underline">Settings</NuxtLink> first.
          </p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <div class="flex gap-4">
              <label v-for="opt in frequencies" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="ga4Form.frequency" :value="opt.value" class="text-gray-900" />
                <span class="text-sm">{{ opt.label }}</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              v-model="ga4Form.startDate"
              type="date"
              class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Pull Hour (Pacific Time)</label>
            <select
              v-model="ga4Form.pullHour"
              class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            >
              <option v-for="h in 24" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00 PT</option>
            </select>
          </div>
          <div v-if="ga4SaveError" class="text-sm text-red-600">{{ ga4SaveError }}</div>
          <div v-if="ga4SaveSuccess" class="text-sm text-green-600">GA4 schedule saved successfully.</div>
          <div class="flex gap-3 pt-1">
            <button
              type="submit"
              :disabled="saving"
              class="text-sm px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {{ saving ? 'Saving…' : 'Save Schedule' }}
            </button>
            <button
              type="button"
              @click="disableGa4Schedule"
              :disabled="saving"
              class="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Disable Schedule
            </button>
          </div>
        </form>
      </div>

      <!-- Manual pull buttons -->
      <div class="bg-white shadow-sm rounded-lg p-5">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Pull Now</h2>
        <p class="text-sm text-gray-500 mb-4">Manually trigger a data pull for this property.</p>
        <div class="flex flex-wrap gap-3">
          <button
            @click="pullTracked"
            :disabled="pulling.tracked"
            class="text-sm px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {{ pulling.tracked ? 'Pulling…' : 'Pull Tracked Keywords' }}
          </button>
          <button
            @click="pullBulk"
            :disabled="pulling.bulk"
            class="text-sm px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {{ pulling.bulk ? 'Pulling…' : 'Pull Bulk Keywords' }}
          </button>
          <button
            @click="pullGa4"
            :disabled="pulling.ga4"
            class="text-sm px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {{ pulling.ga4 ? 'Pulling…' : 'Pull GA4 Data' }}
          </button>
        </div>
        <div v-if="pullMessage" class="text-sm mt-3" :class="pullError ? 'text-red-600' : 'text-green-600'">
          {{ pullMessage }}
        </div>

        <div class="mt-5 pt-5 border-t border-gray-100">
          <p class="text-sm text-gray-500 mb-3">Test GSC and GA4 API queries.</p>
          <div class="flex gap-3">
            <NuxtLink
              to="/test/query"
              class="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Test Query
            </NuxtLink>
            <NuxtLink
              to="/test/bulk"
              class="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Test Bulk
            </NuxtLink>
            <NuxtLink
              to="/test/ga4"
              class="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Test GA4
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="properties.length === 0" class="text-sm text-gray-500">
      No properties found. <NuxtLink to="/dashboard" class="text-indigo-600 hover:underline">Add a property</NuxtLink> first.
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const PT = 'America/Los_Angeles'

interface PullSchedule {
  isScheduled: boolean
  frequency: string
  pullHour: number
  startDate?: string
  nextPullAt?: string
}

interface Property {
  _id: string
  propertyName: string
  gscSiteUrl: string
  ga4PropertyId?: string | null
  lastPulledAt?: string
  ga4LastPulledAt?: string
  pullSchedule?: PullSchedule
  ga4PullSchedule?: PullSchedule
}

function utcHourToPacific(utcHour: number): number {
  const d = new Date()
  d.setUTCHours(utcHour, 0, 0, 0)
  const str = d.toLocaleString('en-US', { timeZone: PT, hour: 'numeric', hour12: false })
  const h = parseInt(str)
  return isNaN(h) ? utcHour : h % 24
}

function pacificHourToUtc(ptHour: number): number {
  for (let u = 0; u < 24; u++) {
    if (utcHourToPacific(u) === ptHour) return u
  }
  return ptHour
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { timeZone: PT }) + ' PT'
}

function formatPullHour(pullHour?: number | null) {
  if (pullHour == null) return '—'
  const ptHour = utcHourToPacific(pullHour)
  return String(ptHour).padStart(2, '0') + ':00 PT'
}

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const activeTab = ref<'gsc' | 'ga4'>('gsc')

const selectedProperty = computed(() =>
  properties.value.find((p) => p._id === selectedPropertyId.value) ?? null
)

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const tomorrowStr = tomorrow.toISOString().split('T')[0]

const frequencies = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

const gscForm = ref({ frequency: 'daily', startDate: tomorrowStr, pullHour: 11 })
const ga4Form = ref({ frequency: 'daily', startDate: tomorrowStr, pullHour: 1 }) // 1am PT default

const saving = ref(false)
const gscSaveError = ref('')
const gscSaveSuccess = ref(false)
const ga4SaveError = ref('')
const ga4SaveSuccess = ref(false)

const pulling = ref({ tracked: false, bulk: false, ga4: false })
const pullMessage = ref('')
const pullError = ref(false)

watch(selectedPropertyId, () => {
  gscSaveSuccess.value = false
  gscSaveError.value = ''
  ga4SaveSuccess.value = false
  ga4SaveError.value = ''
  pullMessage.value = ''

  const p = selectedProperty.value
  if (p?.pullSchedule) {
    gscForm.value.frequency = p.pullSchedule.frequency || 'daily'
    gscForm.value.pullHour = utcHourToPacific(p.pullSchedule.pullHour ?? 18)
    gscForm.value.startDate = p.pullSchedule.startDate
      ? new Date(p.pullSchedule.startDate).toISOString().split('T')[0]
      : tomorrowStr
  }
  if (p?.ga4PullSchedule) {
    ga4Form.value.frequency = p.ga4PullSchedule.frequency || 'daily'
    ga4Form.value.pullHour = utcHourToPacific(p.ga4PullSchedule.pullHour ?? 8)
    ga4Form.value.startDate = p.ga4PullSchedule.startDate
      ? new Date(p.ga4PullSchedule.startDate).toISOString().split('T')[0]
      : tomorrowStr
  }
})

async function loadProperties() {
  const data = await $fetch<{ success: boolean; data: Property[] }>('/api/properties')
  properties.value = data.data || []
  if (properties.value.length === 1) {
    selectedPropertyId.value = properties.value[0]._id
  }
}

async function saveGscSchedule() {
  saving.value = true
  gscSaveError.value = ''
  gscSaveSuccess.value = false
  try {
    const utcHour = pacificHourToUtc(Number(gscForm.value.pullHour))
    const result = await $fetch<{ success: boolean; data: Property }>(
      `/api/properties/${selectedPropertyId.value}`,
      {
        method: 'PUT',
        body: {
          pullSchedule: {
            frequency: gscForm.value.frequency,
            startDate: gscForm.value.startDate,
            pullHour: utcHour,
            isScheduled: true,
          },
        },
      }
    )
    const idx = properties.value.findIndex((p) => p._id === selectedPropertyId.value)
    if (idx >= 0) properties.value.splice(idx, 1, result.data)
    gscSaveSuccess.value = true
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    gscSaveError.value = e?.data?.message || 'Failed to save schedule'
  } finally {
    saving.value = false
  }
}

async function disableGscSchedule() {
  saving.value = true
  gscSaveError.value = ''
  gscSaveSuccess.value = false
  try {
    const result = await $fetch<{ success: boolean; data: Property }>(
      `/api/properties/${selectedPropertyId.value}`,
      {
        method: 'PUT',
        body: { pullSchedule: { isScheduled: false } },
      }
    )
    const idx = properties.value.findIndex((p) => p._id === selectedPropertyId.value)
    if (idx >= 0) properties.value.splice(idx, 1, result.data)
    gscSaveSuccess.value = true
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    gscSaveError.value = e?.data?.message || 'Failed to disable schedule'
  } finally {
    saving.value = false
  }
}

async function saveGa4Schedule() {
  saving.value = true
  ga4SaveError.value = ''
  ga4SaveSuccess.value = false
  try {
    const utcHour = pacificHourToUtc(Number(ga4Form.value.pullHour))
    const result = await $fetch<{ success: boolean; data: Property }>(
      `/api/properties/${selectedPropertyId.value}`,
      {
        method: 'PUT',
        body: {
          ga4PullSchedule: {
            frequency: ga4Form.value.frequency,
            startDate: ga4Form.value.startDate,
            pullHour: utcHour,
            isScheduled: true,
          },
        },
      }
    )
    const idx = properties.value.findIndex((p) => p._id === selectedPropertyId.value)
    if (idx >= 0) properties.value.splice(idx, 1, result.data)
    ga4SaveSuccess.value = true
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    ga4SaveError.value = e?.data?.message || 'Failed to save GA4 schedule'
  } finally {
    saving.value = false
  }
}

async function disableGa4Schedule() {
  saving.value = true
  ga4SaveError.value = ''
  ga4SaveSuccess.value = false
  try {
    const result = await $fetch<{ success: boolean; data: Property }>(
      `/api/properties/${selectedPropertyId.value}`,
      {
        method: 'PUT',
        body: { ga4PullSchedule: { isScheduled: false } },
      }
    )
    const idx = properties.value.findIndex((p) => p._id === selectedPropertyId.value)
    if (idx >= 0) properties.value.splice(idx, 1, result.data)
    ga4SaveSuccess.value = true
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    ga4SaveError.value = e?.data?.message || 'Failed to disable GA4 schedule'
  } finally {
    saving.value = false
  }
}

async function pullTracked() {
  pulling.value.tracked = true
  pullMessage.value = ''
  pullError.value = false
  try {
    await $fetch('/api/pull/tracked', {
      method: 'POST',
      body: { propertyId: selectedPropertyId.value },
    })
    pullMessage.value = 'Tracked keyword pull complete.'
    await loadProperties()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    pullMessage.value = e?.data?.message || 'Pull failed'
    pullError.value = true
  } finally {
    pulling.value.tracked = false
  }
}

async function pullBulk() {
  pulling.value.bulk = true
  pullMessage.value = ''
  pullError.value = false
  try {
    await $fetch('/api/pull/bulk', {
      method: 'POST',
      body: { propertyId: selectedPropertyId.value },
    })
    pullMessage.value = 'Bulk keyword pull complete.'
    await loadProperties()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    pullMessage.value = e?.data?.message || 'Bulk pull failed'
    pullError.value = true
  } finally {
    pulling.value.bulk = false
  }
}

async function pullGa4() {
  pulling.value.ga4 = true
  pullMessage.value = ''
  pullError.value = false
  try {
    const res = await $fetch<{ date: string; counts: Record<string, number> }>('/api/pull/ga4', {
      method: 'POST',
      body: { propertyId: selectedPropertyId.value },
    })
    pullMessage.value = `GA4 pull complete for ${res.date} — ${res.counts.pages} pages, ${res.counts.sources} sources, ${res.counts.devices} devices, ${res.counts.countries} countries.`
    await loadProperties()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    pullMessage.value = e?.data?.message || 'GA4 pull failed'
    pullError.value = true
  } finally {
    pulling.value.ga4 = false
  }
}

onMounted(loadProperties)
</script>
