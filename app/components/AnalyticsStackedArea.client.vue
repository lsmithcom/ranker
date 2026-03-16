<template>
  <div class="h-full w-full">
    <div v-if="!labels.length" class="h-full flex items-center justify-center text-xs text-gray-400">
      No data
    </div>
    <Line v-else :data="chartData" :options="options" style="height: 100%; width: 100%" />
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend)

const props = defineProps<{
  labels: string[]
  series: Array<{ channel: string; values: number[]; color: string }>
}>()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: props.series.map((s, i) => ({
    label: s.channel,
    data: s.values,
    backgroundColor: s.color,
    borderColor: s.color.replace(/[\d.]+\)$/, '1)'),
    borderWidth: 1,
    fill: true,
    tension: 0.3,
    pointRadius: 0,
    pointHoverRadius: 4,
    stack: 'total',
  })),
}))

const options = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: {
      ticks: {
        font: { size: 10 },
        color: '#9ca3af',
        maxTicksLimit: 10,
        maxRotation: 0,
      },
      grid: { display: false },
      border: { display: false },
    },
    y: {
      stacked: true,
      ticks: { font: { size: 10 }, color: '#9ca3af' },
      grid: { color: '#f3f4f6' },
      border: { display: false },
    },
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { font: { size: 11 }, boxWidth: 12, padding: 12 },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `  ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`,
      },
    },
  },
}))
</script>
