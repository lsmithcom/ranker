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
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const props = defineProps<{
  labels: string[]
  datasets: Array<{
    label: string
    values: number[]
    color: string
    fillColor?: string
  }>
  invertY?: boolean
  suffix?: string
  showLegend?: boolean
  formatTooltipValue?: (v: number) => string
}>()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: props.datasets.map((d) => ({
    label: d.label,
    data: d.values,
    borderColor: d.color,
    backgroundColor: d.fillColor ?? 'transparent',
    tension: 0.4,
    pointRadius: 0,
    pointHoverRadius: 4,
    fill: !!d.fillColor,
    borderWidth: 2,
  })),
}))

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
    y: {
      reverse: props.invertY ?? false,
      ticks: {
        font: { size: 10 },
        maxTicksLimit: 5,
        color: '#9ca3af',
        callback: (v) =>
          props.formatTooltipValue
            ? props.formatTooltipValue(v as number)
            : `${v}${props.suffix ?? ''}`,
      },
      grid: { color: '#f3f4f6' },
      border: { display: false },
    },
    x: {
      ticks: { font: { size: 10 }, maxTicksLimit: 8, maxRotation: 0, color: '#9ca3af' },
      grid: { display: false },
      border: { display: false },
    },
  },
  plugins: {
    legend: {
      display: props.showLegend ?? false,
      position: 'top',
      labels: { font: { size: 11 }, boxWidth: 12, padding: 10 },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const v = ctx.parsed.y
          const formatted = props.formatTooltipValue
            ? props.formatTooltipValue(v)
            : `${v}${props.suffix ?? ''}`
          return ` ${ctx.dataset.label}: ${formatted}`
        },
      },
    },
  },
}))
</script>
