<template>
  <div class="h-full w-full">
    <div v-if="!labels.length" class="h-full flex items-center justify-center text-xs text-gray-400">
      No data yet
    </div>
    <Line v-else :data="chartData" :options="chartOptions" style="height: 100%; width: 100%" />
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
  Tooltip,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const props = defineProps<{
  labels: string[]
  values: number[]
  color: string
  fillColor: string
  invertY?: boolean
  tooltipLabel?: string
}>()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.values,
      borderColor: props.color,
      backgroundColor: props.fillColor,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true,
      borderWidth: 2,
    },
  ],
}))

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      reverse: props.invertY ?? false,
      ticks: { font: { size: 10 }, maxTicksLimit: 4, color: '#9ca3af' },
      grid: { color: '#f3f4f6' },
      border: { display: false },
    },
    x: {
      ticks: { font: { size: 10 }, maxTicksLimit: 7, maxRotation: 0, color: '#9ca3af' },
      grid: { display: false },
      border: { display: false },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `${props.tooltipLabel ?? ''}: ${ctx.parsed.y}`,
      },
    },
  },
}))
</script>
