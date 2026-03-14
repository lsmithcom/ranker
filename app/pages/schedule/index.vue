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
      <!-- Status card -->
      <div class="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-700">Schedule Status</span>
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
        <dl class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt class="text-gray-500">Frequency</dt>
            <dd class="font-medium capitalize">{{ selectedProperty.pullSchedule?.frequency || '—' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Pull Hour</dt>
            <dd class="font-medium">{{ formatPullHour(selectedProperty.pullSchedule?.pullHour) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Last Pulled</dt>
            <dd class="font-medium">{{ formatDate(selectedProperty.lastPulledAt) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Next Pull At</dt>
            <dd class="font-medium">{{ formatDate(selectedProperty.pullSchedule?.nextPullAt) }}</dd>
          </div>
        </dl>
      </div>

      <!-- Schedule form -->
      <div class="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h2 class="text-sm font-semibold text-gray-900 mb-4">Configure Schedule</h2>

        <form @submit.prevent="saveSchedule" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <div class="flex gap-4">
              <label v-for="opt in frequencies" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="form.frequency" :value="opt.value" class="text-gray-900" />
                <span class="text-sm">{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              v-model="form.startDate"
              type="date"
              class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Pull Hour (Pacific Time)</label>
            <select
              v-model="form.pullHour"
              class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            >
              <option v-for="h in 24" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00 PT</option>
            </select>
          </div>

          <div v-if="saveError" class="text-sm text-red-600">{{ saveError }}</div>
          <div v-if="saveSuccess" class="text-sm text-green-600">Schedule saved successfully.</div>

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
              @click="disableSchedule"
              :disabled="saving"
              class="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Disable Schedule
            </button>
          </div>
        </form>
      </div>

      <!-- Manual pull buttons -->
      <div class="bg-white border border-gray-200 rounded-lg p-5">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Pull Now</h2>
        <p class="text-sm text-gray-500 mb-4">Manually trigger a data pull for this property.</p>
        <div class="flex gap-3">
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
        </div>
        <div v-if="pullMessage" class="text-sm mt-3" :class="pullError ? 'text-red-600' : 'text-green-600'">
          {{ pullMessage }}
        </div>

        <div class="mt-5 pt-5 border-t border-gray-100">
          <p class="text-sm text-gray-500 mb-3">Test GSC API queries for this property.</p>
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

interface Property {
  _id: string
  propertyName: string
  gscSiteUrl: string
  lastPulledAt?: string
  pullSchedule?: {
    isScheduled: boolean
    frequency: string
    pullHour: number
    startDate?: string
    nextPullAt?: string
  }
}

// Convert a UTC hour (0-23) to Pacific hour, respecting DST automatically.
function utcHourToPacific(utcHour: number): number {
  const d = new Date()
  d.setUTCHours(utcHour, 0, 0, 0)
  const str = d.toLocaleString('en-US', { timeZone: PT, hour: 'numeric', hour12: false })
  const h = parseInt(str)
  return isNaN(h) ? utcHour : h % 24
}

// Convert a Pacific hour (0-23) to UTC hour, respecting DST automatically.
function pacificHourToUtc(ptHour: number): number {
  for (let u = 0; u < 24; u++) {
    if (utcHourToPacific(u) === ptHour) return u
  }
  return ptHour
}

// Format any date string in Pacific time.
function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { timeZone: PT }) + ' PT'
}

// Display the stored UTC pullHour as Pacific time.
function formatPullHour(pullHour?: number | null) {
  if (pullHour == null) return '—'
  const ptHour = utcHourToPacific(pullHour)
  return String(ptHour).padStart(2, '0') + ':00 PT'
}

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')

const selectedProperty = computed(() =>
  properties.value.find((p) => p._id === selectedPropertyId.value) ?? null
)

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const tomorrowStr = tomorrow.toISOString().split('T')[0]

// form.pullHour is always in Pacific time for display/input
const form = ref({
  frequency: 'daily',
  startDate: tomorrowStr,
  pullHour: 11, // default 11:00 PT
})

const frequencies = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

const pulling = ref({ tracked: false, bulk: false })
const pullMessage = ref('')
const pullError = ref(false)

// Populate form when property changes; convert stored UTC pullHour → Pacific
watch(selectedPropertyId, () => {
  saveSuccess.value = false
  saveError.value = ''
  pullMessage.value = ''
  const p = selectedProperty.value
  if (p?.pullSchedule) {
    form.value.frequency = p.pullSchedule.frequency || 'daily'
    form.value.pullHour = utcHourToPacific(p.pullSchedule.pullHour ?? 18)
    form.value.startDate = p.pullSchedule.startDate
      ? new Date(p.pullSchedule.startDate).toISOString().split('T')[0]
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

async function saveSchedule() {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    // Convert Pacific hour → UTC before sending to server
    const utcHour = pacificHourToUtc(Number(form.value.pullHour))
    const result = await $fetch<{ success: boolean; data: Property }>(
      `/api/properties/${selectedPropertyId.value}`,
      {
        method: 'PUT',
        body: {
          pullSchedule: {
            frequency: form.value.frequency,
            startDate: form.value.startDate,
            pullHour: utcHour,
            isScheduled: true,
          },
        },
      }
    )
    const idx = properties.value.findIndex((p) => p._id === selectedPropertyId.value)
    if (idx >= 0) properties.value.splice(idx, 1, result.data)
    saveSuccess.value = true
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    saveError.value = e?.data?.message || 'Failed to save schedule'
  } finally {
    saving.value = false
  }
}

async function disableSchedule() {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
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
    saveSuccess.value = true
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    saveError.value = e?.data?.message || 'Failed to disable schedule'
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

onMounted(loadProperties)
</script>
