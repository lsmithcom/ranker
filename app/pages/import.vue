<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-xl font-semibold text-gray-900 mb-2">Import Rankings from Excel</h1>
    <p class="text-sm text-gray-500 mb-8">
      Upload a spreadsheet with the format: <strong>Keyword</strong> in column A, followed by
      alternating <strong>date / URL</strong> column pairs. Each row is one keyword; each date
      column holds the ranking position for that date.
    </p>

    <!-- Property selector -->
    <div class="mb-5">
      <label class="block text-sm font-medium text-gray-700 mb-1">Property</label>
      <select
        v-model="selectedPropertyId"
        :disabled="importing"
        class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 w-full max-w-sm"
      >
        <option value="">Select a property…</option>
        <option v-for="p in properties" :key="p._id" :value="p._id">{{ p.propertyName }}</option>
      </select>
    </div>

    <!-- File drop zone -->
    <div class="mb-6">
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
          <button
            class="mt-2 text-xs text-red-500 hover:text-red-700"
            @click.stop="clearFile"
          >
            Remove
          </button>
        </div>
        <div v-else>
          <p class="text-sm text-gray-500">Drop your file here, or click to browse</p>
          <p class="text-xs text-gray-400 mt-1">Accepted: .xlsx, .xls</p>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept=".xlsx,.xls"
        class="hidden"
        @change="onFileChange"
      />
    </div>

    <!-- Import button -->
    <button
      :disabled="!canImport"
      class="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      @click="runImport"
    >
      {{ importing ? 'Importing…' : 'Import' }}
    </button>

    <!-- Validation / server error -->
    <div v-if="errorMessage" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-sm font-semibold text-red-700 mb-1">Import failed</p>
      <p class="text-sm text-red-600 whitespace-pre-wrap">{{ errorMessage }}</p>
    </div>

    <!-- Success results -->
    <div v-if="results" class="mt-6 p-5 bg-white border border-gray-200 rounded-lg">
      <p class="text-sm font-semibold text-gray-900 mb-4">Import complete</p>

      <div class="grid grid-cols-2 gap-4 mb-4">
        <!-- Tracked Keywords -->
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tracked Keywords</p>
          <p class="text-sm">
            <span class="text-green-700 font-semibold">{{ results.trackedKeywords.created }}</span>
            created
          </p>
          <p class="text-sm text-gray-500">
            {{ results.trackedKeywords.skipped }} already existed (skipped)
          </p>
          <p v-if="results.trackedKeywords.invalidRows > 0" class="text-sm text-orange-600">
            {{ results.trackedKeywords.invalidRows }} invalid rows skipped
          </p>
        </div>

        <!-- Rankings -->
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Keyword Rankings</p>
          <p class="text-sm">
            <span class="text-green-700 font-semibold">{{ results.rankings.created }}</span>
            created
          </p>
          <p class="text-sm text-gray-500">
            {{ results.rankings.skipped }} already existed (skipped)
          </p>
        </div>
      </div>

      <p class="text-xs text-gray-400">{{ results.dateColumnsFound }} date columns processed</p>

      <!-- Row warnings -->
      <div v-if="results.warnings.length > 0" class="mt-4 border-t border-gray-100 pt-4">
        <p class="text-xs font-medium text-orange-600 mb-2">
          Warnings ({{ results.warnings.length }})
        </p>
        <ul class="text-xs text-orange-500 space-y-1 max-h-40 overflow-y-auto">
          <li v-for="w in results.warnings" :key="w">{{ w }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Property {
  _id: string
  propertyName: string
}

interface ImportResults {
  trackedKeywords: { created: number; skipped: number; invalidRows: number }
  rankings: { created: number; skipped: number }
  dateColumnsFound: number
  warnings: string[]
}

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const importing = ref(false)
const errorMessage = ref<string | null>(null)
const results = ref<ImportResults | null>(null)

const canImport = computed(() => !!selectedPropertyId.value && !!selectedFile.value && !importing.value)

async function loadProperties() {
  const data = await $fetch<{ success: boolean; data: Property[] }>('/api/properties')
  properties.value = data.data || []
  if (properties.value.length === 1) {
    selectedPropertyId.value = properties.value[0]._id
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    selectedFile.value = input.files[0]
    errorMessage.value = null
    results.value = null
  }
  // Reset so the same file can be re-selected after clearing
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    errorMessage.value = 'Please select a .xlsx or .xls file.'
    return
  }
  selectedFile.value = file
  errorMessage.value = null
  results.value = null
}

function clearFile() {
  selectedFile.value = null
  errorMessage.value = null
  results.value = null
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function runImport() {
  if (!canImport.value || !selectedFile.value) return
  importing.value = true
  errorMessage.value = null
  results.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('propertyId', selectedPropertyId.value)

    const response = await $fetch<{ success: boolean; results: ImportResults }>(
      '/api/import/excel',
      { method: 'POST', body: formData }
    )
    results.value = response.results
  } catch (e: any) {
    errorMessage.value = e?.data?.message ?? e?.message ?? 'An unexpected error occurred.'
  } finally {
    importing.value = false
  }
}

onMounted(loadProperties)
</script>
