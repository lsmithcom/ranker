<template>
  <div class="h-full w-full">
    <div v-if="!labels.length" class="h-full flex items-center justify-center text-xs text-gray-400">
      No data
    </div>
    <Bar v-else :data="chartData" :options="options" style="height: 100%; width: 100%" />
  </div>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps<{
  labels: string[]
  datasets: Array<{ label: string; values: number[]; color: string }>
  suffix?: string
  horizontal?: boolean
}>()

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.labels,
  datasets: props.datasets.map((d) => ({
    label: d.label,
    data: d.values,
    backgroundColor: d.color,
    borderRadius: 3,
    borderWidth: 0,
  })),
}))

const options = computed<ChartOptions<'bar'>>(() => ({
  indexAxis: props.horizontal ? ('y' as const) : ('x' as const),
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: {
        font: { size: 10 },
        color: '#9ca3af',
        callback: (v) => `${v}${props.suffix ?? ''}`,
        maxTicksLimit: 6,
      },
      grid: { color: '#f3f4f6' },
      border: { display: false },
    },
    y: {
      ticks: { font: { size: 11 }, color: '#374151' },
      grid: { display: false },
      border: { display: false },
    },
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { font: { size: 11 }, boxWidth: 10, padding: 12 },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `  ${ctx.dataset.label}: ${(ctx.parsed.x ?? ctx.parsed.y).toFixed(1)}${props.suffix ?? ''}`,
      },
    },
  },
}))
</script>
