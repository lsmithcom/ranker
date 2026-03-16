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
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps<{
  labels: string[]
  values: number[]
  colors: string[]
  suffix?: string
}>()

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.values,
      backgroundColor: props.colors,
      borderRadius: 3,
      borderWidth: 0,
    },
  ],
}))

const options = computed<ChartOptions<'bar'>>(() => ({
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: {
        font: { size: 10 },
        color: '#9ca3af',
        callback: (v) => `${v}${props.suffix ?? ''}`,
        maxTicksLimit: 5,
      },
      grid: { color: '#f3f4f6' },
      border: { display: false },
    },
    y: {
      ticks: { font: { size: 12 }, color: '#374151' },
      grid: { display: false },
      border: { display: false },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `  CTR: ${(ctx.parsed.x as number).toFixed(2)}${props.suffix ?? ''}`,
      },
    },
  },
}))
</script>
