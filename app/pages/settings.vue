<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-xl font-semibold text-gray-900 mb-8">Settings</h1>

    <!-- ── Google Search Console ──────────────────────────────── -->
    <div class="mb-10">
      <h2 class="text-base font-semibold text-gray-700 mb-1">Google Search Console</h2>
      <p class="text-sm text-gray-400 mb-4">Connect your GSC account to pull ranking data for your properties.</p>

      <!-- Connection status banner -->
      <div
        v-if="gscStatus"
        :class="gscStatus === 'connected' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'"
        class="border rounded px-4 py-3 text-sm mb-4"
      >
        {{ gscStatus === 'connected' ? 'Google Search Console connected successfully.' : `GSC connection error: ${gscError}` }}
      </div>

      <a
        href="/api/auth/google"
        class="inline-flex items-center gap-2 text-sm border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
      >
        Connect Google Search Console
      </a>
    </div>

    <!-- ── Properties ─────────────────────────────────────────── -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base font-semibold text-gray-700">Properties</h2>
          <p class="text-sm text-gray-400 mt-0.5">Manage your tracked GSC properties.</p>
        </div>
        <button
          @click="showAddProperty = !showAddProperty"
          class="text-sm bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700 transition-colors"
        >
          Add Property
        </button>
      </div>

      <!-- Add property form -->
      <div v-if="showAddProperty" class="bg-white shadow-sm rounded p-4 mb-4">
        <h3 class="text-sm font-medium text-gray-700 mb-3">Add New Property</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Property Name</label>
            <input
              v-model="newProperty.propertyName"
              type="text"
              placeholder="My Website"
              class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Property URL</label>
            <input
              v-model="newProperty.propertyUrl"
              type="text"
              placeholder="https://example.com"
              class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">GSC Site URL</label>
            <input
              v-model="newProperty.gscSiteUrl"
              type="text"
              placeholder="sc-domain:example.com"
              class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-2">
          GSC Site URL is either <code>sc-domain:example.com</code> (domain property) or
          <code>https://example.com/</code> (URL prefix property)
        </p>
        <div class="flex gap-2 mt-3">
          <button
            @click="addProperty"
            :disabled="addingProperty"
            class="text-sm bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {{ addingProperty ? 'Adding...' : 'Add' }}
          </button>
          <button
            @click="showAddProperty = false"
            class="text-sm border border-gray-300 px-4 py-1.5 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
        <p v-if="propertyError" class="text-xs text-red-600 mt-2">{{ propertyError }}</p>
      </div>

      <!-- Properties table -->
      <div v-if="propertiesLoading" class="text-sm text-gray-400">Loading properties...</div>
      <div
        v-else-if="!properties.length"
        class="text-sm text-gray-400 bg-white shadow-sm rounded p-6 text-center"
      >
        No properties yet. Add your first GSC property above.
      </div>
      <div v-else class="bg-white shadow-sm rounded overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
              <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">GSC Site URL</th>
              <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">GA4 Property ID</th>
              <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Last GSC Pull</th>
              <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Last GA4 Pull</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="prop in properties" :key="prop._id">
              <td class="px-4 py-3 font-medium text-gray-800">{{ prop.propertyName }}</td>
              <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ prop.gscSiteUrl }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <input
                    v-model="ga4EditValues[prop._id]"
                    type="text"
                    placeholder="e.g. 316754772"
                    class="border border-gray-300 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                  <button
                    @click="saveGa4PropertyId(prop)"
                    :disabled="ga4Saving[prop._id]"
                    class="text-xs bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {{ ga4Saving[prop._id] ? '...' : 'Save' }}
                  </button>
                  <button
                    v-if="prop.ga4PropertyId"
                    @click="triggerGa4Pull(prop)"
                    :disabled="ga4PullLoading[prop._id]"
                    class="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {{ ga4PullLoading[prop._id] ? 'Pulling...' : 'Pull Now' }}
                  </button>
                </div>
                <p v-if="ga4PullResult[prop._id]" class="text-xs mt-1" :class="ga4PullResult[prop._id].startsWith('Error') ? 'text-red-500' : 'text-green-600'">
                  {{ ga4PullResult[prop._id] }}
                </p>
              </td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ prop.lastPulledAt ? formatDate(prop.lastPulledAt) : 'Never' }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ prop.ga4LastPulledAt ? formatDate(prop.ga4LastPulledAt) : 'Never' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Property {
  _id: string
  propertyName: string
  propertyUrl: string
  gscSiteUrl: string
  lastPulledAt: string | null
  ga4PropertyId: string | null
  ga4LastPulledAt: string | null
}

const route = useRoute()
const gscStatus = computed(() => route.query.gsc as string | undefined)
const gscError = computed(() => route.query.reason as string | undefined)

const properties = ref<Property[]>([])
const propertiesLoading = ref(true)
const showAddProperty = ref(false)
const addingProperty = ref(false)
const propertyError = ref('')
const newProperty = reactive({ propertyName: '', propertyUrl: '', gscSiteUrl: '' })

// GA4 property ID editing — keyed by property _id
const ga4EditValues = ref<Record<string, string>>({})
const ga4Saving = ref<Record<string, boolean>>({})
const ga4PullLoading = ref<Record<string, boolean>>({})
const ga4PullResult = ref<Record<string, string>>({})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

async function loadProperties() {
  propertiesLoading.value = true
  try {
    const res = await $fetch<{ data: Property[] }>('/api/properties')
    properties.value = res.data
    // Pre-populate GA4 edit fields with current values
    for (const p of res.data) {
      ga4EditValues.value[p._id] = p.ga4PropertyId || ''
    }
  } catch {
    // silent
  } finally {
    propertiesLoading.value = false
  }
}

async function saveGa4PropertyId(prop: Property) {
  ga4Saving.value[prop._id] = true
  try {
    await $fetch(`/api/properties/${prop._id}`, {
      method: 'PUT',
      body: { ga4PropertyId: ga4EditValues.value[prop._id] || null },
    })
    prop.ga4PropertyId = ga4EditValues.value[prop._id] || null
  } catch {
    // silent — user can retry
  } finally {
    ga4Saving.value[prop._id] = false
  }
}

async function triggerGa4Pull(prop: Property) {
  ga4PullLoading.value[prop._id] = true
  ga4PullResult.value[prop._id] = ''
  try {
    const res = await $fetch<{ date: string; counts: Record<string, number> }>('/api/pull/ga4', {
      method: 'POST',
      body: { propertyId: prop._id },
    })
    const c = res.counts
    ga4PullResult.value[prop._id] = `Pulled ${res.date}: ${c.pages} pages, ${c.sources} sources, ${c.devices} devices, ${c.countries} countries`
    prop.ga4LastPulledAt = new Date().toISOString()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    ga4PullResult.value[prop._id] = `Error: ${e?.data?.message || 'Pull failed'}`
  } finally {
    ga4PullLoading.value[prop._id] = false
  }
}

async function addProperty() {
  propertyError.value = ''
  addingProperty.value = true
  try {
    await $fetch('/api/properties', {
      method: 'POST',
      body: {
        propertyName: newProperty.propertyName,
        propertyUrl: newProperty.propertyUrl,
        gscSiteUrl: newProperty.gscSiteUrl,
      },
    })
    Object.assign(newProperty, { propertyName: '', propertyUrl: '', gscSiteUrl: '' })
    showAddProperty.value = false
    await loadProperties()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    propertyError.value = e?.data?.message || 'Failed to add property'
  } finally {
    addingProperty.value = false
  }
}

onMounted(loadProperties)
</script>
