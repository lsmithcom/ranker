<template>
  <div class="bg-gray-50 rounded-lg p-3">
    <div class="flex items-center justify-between mb-1">
      <span class="text-xs font-medium text-gray-500">{{ label }}</span>
      <span class="text-sm font-bold tabular-nums" :style="{ color: color }">
        {{ latestValue }}
      </span>
    </div>
    <div class="h-14">
      <div v-if="!values.length || values.every(v => v === 0)" class="h-full flex items-center justify-center text-xs text-gray-300">
        No data
      </div>
      <Line v-else :data="chartData" :options="chartOptions" style="height: 100%; width: 100%" />
    </div>
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
  label: string
  labels: string[]
  values: number[]
  color: string
  fillColor: string
}>()

const latestValue = computed(() => props.values.at(-1) ?? 0)

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.values,
      borderColor: props.color,
      backgroundColor: props.fillColor,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 3,
      fill: true,
      borderWidth: 1.5,
    },
  ],
}))

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: { font: { size: 9 }, maxTicksLimit: 3, color: '#d1d5db' },
      grid: { color: '#f3f4f6' },
      border: { display: false },
    },
    x: {
      display: false,
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (items) => props.labels[items[0].dataIndex] ?? '',
        label: (ctx) => `${props.label}: ${ctx.parsed.y}`,
      },
    },
  },
}))
</script>
