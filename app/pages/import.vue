<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-xl font-semibold text-gray-900 mb-8">Import</h1>

    <!-- ── Section 1: Pull Schedule ──────────────────────────────── -->
    <div class="mb-12">
      <h2 class="text-base font-semibold text-gray-700 mb-5">Pull Schedule</h2>

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
        <div class="bg-white shadow-sm rounded-lg p-5 mb-5">
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

        <!-- Configure Schedule form -->
        <div class="bg-white shadow-sm rounded-lg p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">Configure Schedule</h3>
          <form @submit.prevent="saveSchedule" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
              <div class="flex gap-4">
                <label v-for="opt in frequencies" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" v-model="scheduleForm.frequency" :value="opt.value" class="text-gray-900" />
                  <span class="text-sm">{{ opt.label }}</span>
                </label>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                v-model="scheduleForm.startDate"
                type="date"
                class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Pull Hour (Pacific Time)</label>
              <select
                v-model="scheduleForm.pullHour"
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
      </template>

      <div v-else-if="properties.length === 0" class="text-sm text-gray-500">
        No properties found. <NuxtLink to="/settings" class="text-indigo-600 hover:underline">Add a property</NuxtLink> first.
      </div>
    </div>

    <!-- ── Section 2: Historical Date Import ────────────────────── -->
    <div class="mb-12">
      <h2 class="text-base font-semibold text-gray-700 mb-5">Historical Date Import</h2>

      <!-- Excel Import -->
      <div class="bg-white shadow-sm rounded-lg p-5 mb-6">
        <h3 class="text-sm font-semibold text-gray-900 mb-1">Import Rankings from Excel</h3>
        <p class="text-sm text-gray-500 mb-5">
          Upload a spreadsheet with the format: <strong>Keyword</strong> in column A, followed by
          alternating <strong>date / URL</strong> column pairs. Each row is one keyword; each date
          column holds the ranking position for that date.
        </p>

        <div class="mb-5">
          <label class="block text-sm font-medium text-gray-700 mb-1">Property</label>
          <select
            v-model="excelPropertyId"
            :disabled="importing"
            class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 w-full max-w-sm"
          >
            <option value="">Select a property…</option>
            <option v-for="p in properties" :key="p._id" :value="p._id">{{ p.propertyName }}</option>
          </select>
        </div>

        <div class="mb-5">
          <label class="block text-sm font-medium text-gray-700 mb-1">Excel File (.xlsx or .xls)</label>
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
            :class="dragOver ? 'border-gray-500 bg-gray-50' : 'border-gray-300 hover:border-gray-400'"
            @click="fileInput?.click()"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
          >
            <div v-if="selectedFile">
              <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ formatFileSize(selectedFile.size) }}</p>
              <button class="mt-2 text-xs text-red-500 hover:text-red-700" @click.stop="clearFile">Remove</button>
            </div>
            <div v-else>
              <p class="text-sm text-gray-500">Drop your file here, or click to browse</p>
              <p class="text-xs text-gray-400 mt-1">Accepted: .xlsx, .xls</p>
            </div>
          </div>
          <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFileChange" />
        </div>

        <button
          :disabled="!canImport"
          class="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          @click="runImport"
        >
          {{ importing ? 'Importing…' : 'Import' }}
        </button>

        <div v-if="importError" class="mt-5 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm font-semibold text-red-700 mb-1">Import failed</p>
          <p class="text-sm text-red-600 whitespace-pre-wrap">{{ importError }}</p>
        </div>

        <div v-if="importResults" class="mt-5 p-5 bg-gray-50 rounded-lg">
          <p class="text-sm font-semibold text-gray-900 mb-4">Import complete</p>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tracked Keywords</p>
              <p class="text-sm"><span class="text-green-700 font-semibold">{{ importResults.trackedKeywords.created }}</span> created</p>
              <p class="text-sm text-gray-500">{{ importResults.trackedKeywords.skipped }} already existed (skipped)</p>
              <p v-if="importResults.trackedKeywords.invalidRows > 0" class="text-sm text-orange-600">
                {{ importResults.trackedKeywords.invalidRows }} invalid rows skipped
              </p>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Keyword Rankings</p>
              <p class="text-sm"><span class="text-green-700 font-semibold">{{ importResults.rankings.created }}</span> created</p>
              <p class="text-sm text-gray-500">{{ importResults.rankings.skipped }} already existed (skipped)</p>
            </div>
          </div>
          <p class="text-xs text-gray-400">{{ importResults.dateColumnsFound }} date columns processed</p>
          <div v-if="importResults.warnings.length > 0" class="mt-4 border-t border-gray-100 pt-4">
            <p class="text-xs font-medium text-orange-600 mb-2">Warnings ({{ importResults.warnings.length }})</p>
            <ul class="text-xs text-orange-500 space-y-1 max-h-40 overflow-y-auto">
              <li v-for="w in importResults.warnings" :key="w">{{ w }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- GA4 Historical Import -->
      <div class="bg-white shadow-sm rounded-lg p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-1">Import GA4 Historical Data</h3>
        <p class="text-sm text-gray-500 mb-5">
          Pull GA4 data day-by-day from a date range into the database. Each day is pulled individually
          so large ranges won't time out.
        </p>

        <div class="mb-5">
          <label class="block text-sm font-medium text-gray-700 mb-1">Property</label>
          <select
            v-model="ga4PropertyId"
            :disabled="ga4Importing"
            class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 w-full max-w-sm"
          >
            <option value="">Select a property…</option>
            <option v-for="p in properties" :key="p._id" :value="p._id">
              {{ p.propertyName }} {{ (p as any).ga4PropertyId ? `(GA4: ${(p as any).ga4PropertyId})` : '(no GA4 ID)' }}
            </option>
          </select>
        </div>

        <div class="flex flex-wrap gap-4 mb-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              v-model="ga4StartDate"
              type="date"
              :disabled="ga4Importing"
              class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              v-model="ga4EndDate"
              type="date"
              :disabled="ga4Importing"
              class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
        </div>

        <p v-if="ga4DateCount > 0" class="text-sm text-gray-500 mb-4">
          {{ ga4DateCount }} day{{ ga4DateCount === 1 ? '' : 's' }} will be pulled.
        </p>

        <button
          :disabled="!canGa4Import"
          class="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          @click="runGa4Import"
        >
          {{ ga4Importing ? `Pulling day ${ga4Progress} of ${ga4DateCount}…` : 'Import GA4 History' }}
        </button>

        <div v-if="ga4Importing" class="mt-4 w-full max-w-md bg-gray-200 rounded-full h-2">
          <div
            class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: ga4DateCount > 0 ? `${(ga4Progress / ga4DateCount) * 100}%` : '0%' }"
          ></div>
        </div>

        <div v-if="ga4Error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ ga4Error }}</p>
        </div>

        <div v-if="ga4Results.length > 0 && !ga4Importing" class="mt-4 p-5 bg-gray-50 rounded-lg">
          <p class="text-sm font-semibold text-gray-900 mb-3">
            Import complete — {{ ga4ResultsSuccess }} succeeded, {{ ga4ResultsFailed }} failed
          </p>
          <div class="overflow-x-auto max-h-64 overflow-y-auto">
            <table class="w-full text-xs">
              <thead class="bg-white sticky top-0">
                <tr>
                  <th class="text-left px-3 py-2 text-gray-500 uppercase">Date</th>
                  <th class="text-right px-3 py-2 text-gray-500 uppercase">Pages</th>
                  <th class="text-right px-3 py-2 text-gray-500 uppercase">Sources</th>
                  <th class="text-right px-3 py-2 text-gray-500 uppercase">Devices</th>
                  <th class="text-right px-3 py-2 text-gray-500 uppercase">Countries</th>
                  <th class="text-left px-3 py-2 text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="r in ga4Results.slice().reverse()" :key="r.date" class="hover:bg-white">
                  <td class="px-3 py-1.5 text-gray-600">{{ r.date }}</td>
                  <td class="px-3 py-1.5 text-right text-gray-800">{{ r.counts?.pages ?? '—' }}</td>
                  <td class="px-3 py-1.5 text-right text-gray-800">{{ r.counts?.sources ?? '—' }}</td>
                  <td class="px-3 py-1.5 text-right text-gray-800">{{ r.counts?.devices ?? '—' }}</td>
                  <td class="px-3 py-1.5 text-right text-gray-800">{{ r.counts?.countries ?? '—' }}</td>
                  <td class="px-3 py-1.5" :class="r.error ? 'text-red-600' : 'text-green-600'">
                    {{ r.error || 'OK' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Section 3: Pull Now ────────────────────────────────────── -->
    <div>
      <h2 class="text-base font-semibold text-gray-700 mb-5">Pull Now</h2>

      <div class="bg-white shadow-sm rounded-lg p-5">
        <p class="text-sm text-gray-500 mb-4">
          Manually trigger a data pull for the property selected above.
        </p>
        <div class="flex flex-wrap gap-3">
          <button
            @click="pullTracked"
            :disabled="!selectedPropertyId || pulling.tracked"
            class="text-sm px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {{ pulling.tracked ? 'Pulling…' : 'Pull Tracked Keywords' }}
          </button>
          <button
            @click="pullBulk"
            :disabled="!selectedPropertyId || pulling.bulk"
            class="text-sm px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {{ pulling.bulk ? 'Pulling…' : 'Pull Bulk Keywords' }}
          </button>
          <button
            @click="pullGa4"
            :disabled="!selectedPropertyId || pulling.ga4"
            class="text-sm px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {{ pulling.ga4 ? 'Pulling…' : 'Pull GA4 Data' }}
          </button>
        </div>
        <div v-if="!selectedPropertyId" class="text-xs text-gray-400 mt-3">Select a property in the Pull Schedule section above.</div>
        <div v-if="pullMessage" class="text-sm mt-3" :class="pullError ? 'text-red-600' : 'text-green-600'">
          {{ pullMessage }}
        </div>

        <div class="mt-5 pt-5 border-t border-gray-100">
          <p class="text-sm text-gray-500 mb-3">Test GSC and GA4 API queries.</p>
          <div class="flex gap-3">
            <NuxtLink to="/test/query" class="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Test Query
            </NuxtLink>
            <NuxtLink to="/test/bulk" class="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Test Bulk
            </NuxtLink>
            <NuxtLink to="/test/ga4" class="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Test GA4
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

// ── Types ─────────────────────────────────────────────────────────

interface Property {
  _id: string
  propertyName: string
  lastPulledAt?: string
  pullSchedule?: {
    isScheduled: boolean
    frequency: string
    pullHour: number
    startDate?: string
    nextPullAt?: string
  }
}

interface ImportResults {
  trackedKeywords: { created: number; skipped: number; invalidRows: number }
  rankings: { created: number; skipped: number }
  dateColumnsFound: number
  warnings: string[]
}

// ── Shared ────────────────────────────────────────────────────────

const properties = ref<Property[]>([])

async function loadProperties() {
  const data = await $fetch<{ success: boolean; data: Property[] }>('/api/properties')
  properties.value = data.data || []
  if (properties.value.length === 1) {
    selectedPropertyId.value = properties.value[0]._id
    excelPropertyId.value = properties.value[0]._id
    ga4PropertyId.value = properties.value[0]._id
  }
}

// ── Pull Schedule ─────────────────────────────────────────────────

const PT = 'America/Los_Angeles'

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

const selectedPropertyId = ref('')
const selectedProperty = computed(() =>
  properties.value.find((p) => p._id === selectedPropertyId.value) ?? null
)

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const tomorrowStr = tomorrow.toISOString().split('T')[0]

const scheduleForm = ref({
  frequency: 'daily',
  startDate: tomorrowStr,
  pullHour: 11,
})

const frequencies = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

watch(selectedPropertyId, () => {
  saveSuccess.value = false
  saveError.value = ''
  pullMessage.value = ''
  const p = selectedProperty.value
  if (p?.pullSchedule) {
    scheduleForm.value.frequency = p.pullSchedule.frequency || 'daily'
    scheduleForm.value.pullHour = utcHourToPacific(p.pullSchedule.pullHour ?? 18)
    scheduleForm.value.startDate = p.pullSchedule.startDate
      ? new Date(p.pullSchedule.startDate).toISOString().split('T')[0]
      : tomorrowStr
  }
})

async function saveSchedule() {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    const utcHour = pacificHourToUtc(Number(scheduleForm.value.pullHour))
    const result = await $fetch<{ success: boolean; data: Property }>(
      `/api/properties/${selectedPropertyId.value}`,
      {
        method: 'PUT',
        body: {
          pullSchedule: {
            frequency: scheduleForm.value.frequency,
            startDate: scheduleForm.value.startDate,
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
      { method: 'PUT', body: { pullSchedule: { isScheduled: false } } }
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

// ── Excel Import ──────────────────────────────────────────────────

const excelPropertyId = ref('')
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const importing = ref(false)
const importError = ref<string | null>(null)
const importResults = ref<ImportResults | null>(null)

const canImport = computed(() => !!excelPropertyId.value && !!selectedFile.value && !importing.value)

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    selectedFile.value = input.files[0]
    importError.value = null
    importResults.value = null
  }
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    importError.value = 'Please select a .xlsx or .xls file.'
    return
  }
  selectedFile.value = file
  importError.value = null
  importResults.value = null
}

function clearFile() {
  selectedFile.value = null
  importError.value = null
  importResults.value = null
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function runImport() {
  if (!canImport.value || !selectedFile.value) return
  importing.value = true
  importError.value = null
  importResults.value = null
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('propertyId', excelPropertyId.value)
    const response = await $fetch<{ success: boolean; results: ImportResults }>(
      '/api/import/excel',
      { method: 'POST', body: formData }
    )
    importResults.value = response.results
  } catch (e: any) {
    importError.value = e?.data?.message ?? e?.message ?? 'An unexpected error occurred.'
  } finally {
    importing.value = false
  }
}

// ── GA4 Historical Import ─────────────────────────────────────────

const ga4PropertyId = ref('')
const ga4Importing = ref(false)
const ga4Progress = ref(0)
const ga4Error = ref<string | null>(null)
const ga4Results = ref<{ date: string; counts?: Record<string, number>; error?: string }[]>([])

const ga4ResultsSuccess = computed(() => ga4Results.value.filter((r) => !r.error).length)
const ga4ResultsFailed = computed(() => ga4Results.value.filter((r) => !!r.error).length)

const ga4StartDate = ref((() => {
  const d = new Date()
  d.setDate(d.getDate() - 90)
  return d.toISOString().split('T')[0]
})())
const ga4EndDate = ref((() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
})())

const ga4DateCount = computed(() => {
  if (!ga4StartDate.value || !ga4EndDate.value) return 0
  const start = new Date(ga4StartDate.value)
  const end = new Date(ga4EndDate.value)
  if (end < start) return 0
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1
})

const canGa4Import = computed(
  () => !!ga4PropertyId.value && ga4DateCount.value > 0 && !ga4Importing.value
)

function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = []
  const current = new Date(startStr)
  const end = new Date(endStr)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return dates
}

async function runGa4Import() {
  if (!canGa4Import.value) return
  ga4Importing.value = true
  ga4Error.value = null
  ga4Results.value = []
  ga4Progress.value = 0
  const dates = getDatesInRange(ga4StartDate.value, ga4EndDate.value)
  for (const date of dates) {
    ga4Progress.value++
    try {
      const res = await $fetch<{ date: string; counts: Record<string, number> }>('/api/pull/ga4', {
        method: 'POST',
        body: { propertyId: ga4PropertyId.value, date },
      })
      ga4Results.value.push({ date: res.date, counts: res.counts })
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      ga4Results.value.push({ date, error: e?.data?.message || 'Pull failed' })
    }
  }
  ga4Importing.value = false
}

// ── Pull Now ──────────────────────────────────────────────────────

const pulling = ref({ tracked: false, bulk: false, ga4: false })
const pullMessage = ref('')
const pullError = ref(false)

async function pullTracked() {
  pulling.value.tracked = true
  pullMessage.value = ''
  pullError.value = false
  try {
    await $fetch('/api/pull/tracked', { method: 'POST', body: { propertyId: selectedPropertyId.value } })
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
    await $fetch('/api/pull/bulk', { method: 'POST', body: { propertyId: selectedPropertyId.value } })
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
