<template>
  <div class="p-4">
    <div class="flex items-center gap-2 mb-3">
      <button
        v-for="r in ranges"
        :key="r.value"
        @click="activeRange = r.value"
        :class="[
          'text-xs px-2 py-1 rounded border transition-colors',
          activeRange === r.value
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400',
        ]"
      >
        {{ r.label }}
      </button>
    </div>

    <div v-if="loading" class="h-48 flex items-center justify-center text-gray-400 text-sm">
      Loading chart…
    </div>
    <div v-else-if="!chartData.labels?.length" class="h-48 flex items-center justify-center text-gray-400 text-sm">
      No ranking history yet.
    </div>
    <Line v-else :data="chartData" :options="chartOptions" class="max-h-48" />
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps<{
  keyword: string
  propertyId: string
  source: 'specific_query' | 'bulk_discovery'
}>()

const ranges: { label: string; value: '6m' | '1y' | '2y' }[] = [
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
]

const activeRange = ref<'6m' | '1y' | '2y'>('6m')
const loading = ref(false)

interface HistoryPoint {
  date: string
  position: number
}

const history = ref<HistoryPoint[]>([])

async function fetchHistory() {
  loading.value = true
  try {
    const data = await $fetch<{ success: boolean; data: HistoryPoint[] }>('/api/rankings/history', {
      query: {
        keyword: props.keyword,
        propertyId: props.propertyId,
        source: props.source,
        range: activeRange.value,
      },
    })
    history.value = data.data || []
  } catch {
    history.value = []
  } finally {
    loading.value = false
  }
}

watch(activeRange, fetchHistory)

onMounted(fetchHistory)

const chartData = computed<ChartData<'line'>>(() => ({
  labels: history.value.map((p) => {
    const d = new Date(p.date)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }),
  datasets: [
    {
      label: 'Position',
      data: history.value.map((p) => p.position),
      borderColor: '#4F46E5',
      backgroundColor: 'rgba(79, 70, 229, 0.08)',
      tension: 0.3,
      pointRadius: 3,
      fill: true,
    },
  ],
}))

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      reverse: true,
      title: { display: false },
      ticks: { stepSize: 1, font: { size: 11 } },
      grid: { color: '#f1f5f9' },
    },
    x: {
      ticks: { font: { size: 11 } },
      grid: { display: false },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `Rank: ${ctx.parsed.y}`,
      },
    },
  },
}))
</script>
