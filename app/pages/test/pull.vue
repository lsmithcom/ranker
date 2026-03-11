<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-xl font-semibold text-gray-900 mb-6">Pull Diagnostics</h1>

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

    <div class="flex gap-3 mb-6">
      <button
        @click="runTest('tracked')"
        :disabled="running"
        class="text-sm px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
      >
        {{ running === 'tracked' ? 'Running…' : 'Test Tracked Pull' }}
      </button>
      <button
        @click="runTest('bulk')"
        :disabled="running"
        class="text-sm px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
      >
        {{ running === 'bulk' ? 'Running…' : 'Test Bulk Pull' }}
      </button>
    </div>

    <div v-if="result" class="bg-white border rounded-lg p-4">
      <div class="flex items-center gap-2 mb-3">
        <span
          :class="['text-xs px-2 py-0.5 rounded-full font-medium', result.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']"
        >
          {{ result.ok ? 'SUCCESS' : 'ERROR' }}
        </span>
        <span class="text-sm text-gray-500">HTTP {{ result.status }}</span>
      </div>
      <pre class="text-xs bg-gray-50 border rounded p-3 overflow-auto whitespace-pre-wrap break-all">{{ result.body }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Property {
  _id: string
  propertyName: string
}

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const running = ref<'tracked' | 'bulk' | false>(false)
const result = ref<{ ok: boolean; status: number; body: string } | null>(null)

async function loadProperties() {
  const data = await $fetch<{ success: boolean; data: Property[] }>('/api/properties')
  properties.value = data.data || []
  if (properties.value.length === 1) selectedPropertyId.value = properties.value[0]._id
}

async function runTest(type: 'tracked' | 'bulk') {
  if (!selectedPropertyId.value) return alert('Select a property first')
  running.value = type
  result.value = null

  const url = type === 'tracked' ? '/api/pull/tracked' : '/api/pull/bulk'

  try {
    const res = await $fetch.raw(url, {
      method: 'POST',
      body: { propertyId: selectedPropertyId.value },
    })
    result.value = {
      ok: true,
      status: res.status,
      body: JSON.stringify(res._data, null, 2),
    }
  } catch (err: unknown) {
    const e = err as { response?: { status: number; _data?: unknown } }
    result.value = {
      ok: false,
      status: e.response?.status ?? 0,
      body: JSON.stringify(e.response?._data ?? String(err), null, 2),
    }
  } finally {
    running.value = false
  }
}

onMounted(loadProperties)
</script>
