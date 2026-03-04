<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/40" @click="$emit('close')" />
    <div class="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
      <h2 class="text-base font-semibold text-gray-900 mb-1">Move to Group</h2>
      <p class="text-sm text-gray-500 mb-4">{{ selectedIds.length }} item(s) selected</p>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Group</label>
          <select
            v-model="groupId"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
          >
            <option value="">No group (ungrouped)</option>
            <option v-for="opt in flatGroupOptions" :key="opt.group._id" :value="opt.group._id">
              {{ '— '.repeat(opt.depth) }}{{ opt.group.name }}
            </option>
          </select>
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
            {{ loading ? 'Moving…' : 'Move' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Group {
  _id: string
  name: string
  parentId: string | null
}

interface FlatOption {
  group: Group
  depth: number
}

const props = defineProps<{
  selectedIds: string[]
  groups: Group[]
  type: 'tracked' | 'bulk'
  propertyId: string
  selectedKeywords?: string[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'moved'): void
}>()

const groupId = ref('')
const loading = ref(false)
const error = ref('')

const flatGroupOptions = computed<FlatOption[]>(() => {
  const result: FlatOption[] = []
  const childrenMap = new Map<string | null, Group[]>()

  for (const g of props.groups) {
    const pid = g.parentId || null
    if (!childrenMap.has(pid)) childrenMap.set(pid, [])
    childrenMap.get(pid)!.push(g)
  }

  function traverse(pid: string | null, depth: number) {
    for (const g of childrenMap.get(pid) || []) {
      result.push({ group: g, depth })
      traverse(g._id, depth + 1)
    }
  }

  traverse(null, 0)
  return result
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (props.type === 'tracked') {
      await Promise.all(
        props.selectedIds.map((id) =>
          $fetch(`/api/keywords/${id}`, {
            method: 'PUT',
            body: { groupId: groupId.value || null },
          })
        )
      )
    } else {
      const keywords = props.selectedKeywords || []
      await Promise.all(
        keywords.map((kw) =>
          $fetch('/api/bulk-meta/assign', {
            method: 'POST',
            body: {
              keyword: kw,
              propertyId: props.propertyId,
              groupId: groupId.value || null,
            },
          })
        )
      )
    }
    emit('moved')
    emit('close')
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    error.value = e?.data?.message || 'Failed to move items'
  } finally {
    loading.value = false
  }
}
</script>
