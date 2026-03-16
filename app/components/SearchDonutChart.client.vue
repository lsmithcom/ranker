<template>
  <div class="relative h-full w-full">
    <div v-if="isEmpty" class="h-full flex items-center justify-center">
      <span class="text-xs text-gray-400">No data</span>
    </div>
    <template v-else>
      <Doughnut :data="chartData" :options="options" style="height: 100%; width: 100%" />
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="text-center leading-tight">
          <div class="text-xl font-bold text-gray-800 tabular-nums">{{ total.toLocaleString() }}</div>
          <div class="text-xs text-gray-400 mt-0.5">ranked</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

const props = defineProps<{
  segments: { label: string; value: number; color: string }[]
}>()

const isEmpty = computed(() => props.segments.every((s) => s.value === 0))
const total = computed(() => props.segments.reduce((s, seg) => s + seg.value, 0))

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: props.segments.map((s) => s.label),
  datasets: [
    {
      data: props.segments.map((s) => s.value),
      backgroundColor: props.segments.map((s) => s.color),
      borderWidth: 2,
      borderColor: '#fff',
      hoverBorderWidth: 2,
    },
  ],
}))

const options: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `  ${ctx.label}: ${ctx.parsed.toLocaleString()}`,
      },
    },
  },
}
</script>
