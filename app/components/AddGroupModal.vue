<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/40" @click="$emit('close')" />
    <div class="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
      <h2 class="text-base font-semibold text-gray-900 mb-4">Add Group</h2>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Group Name <span class="text-red-500">*</span></label>
          <input
            v-model="name"
            type="text"
            placeholder="e.g. Brand Keywords"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            required
            autofocus
          />
        </div>

        <div v-if="error" class="text-sm text-red-600">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="$emit('close')"
            class="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="text-sm px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {{ loading ? 'Creating…' : 'Create Group' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  propertyId: string
  type: 'tracked' | 'bulk'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', group: unknown): void
}>()

const name = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const data = await $fetch<{ success: boolean; data: unknown }>('/api/groups', {
      method: 'POST',
      body: { propertyId: props.propertyId, name: name.value, type: props.type },
    })
    emit('created', data.data)
    emit('close')
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    error.value = e?.data?.message || 'Failed to create group'
  } finally {
    loading.value = false
  }
}
</script>
