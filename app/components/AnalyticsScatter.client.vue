<template>
  <div class="h-full w-full">
    <div v-if="!points.length" class="h-full flex items-center justify-center text-xs text-gray-400">
      No data
    </div>
    <Scatter v-else :data="chartData" :options="options" :plugins="[quadrantPlugin]" style="height: 100%; width: 100%" />
  </div>
</template>

<script setup lang="ts">
import { Scatter } from 'vue-chartjs'
import {
  Chart as ChartJS,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from 'chart.js'

ChartJS.register(PointElement, LinearScale, Tooltip, Legend)

const props = defineProps<{
  points: Array<{ x: number; y: number; label: string; quadrant: 'star' | 'underrated' | 'risky' | 'weak' }>
  xLabel?: string
  yLabel?: string
  ySuffix?: string
  medianX: number
  medianY: number
}>()

const COLORS: Record<string, string> = {
  star: 'rgba(34, 197, 94, 0.75)',
  underrated: 'rgba(59, 130, 246, 0.75)',
  risky: 'rgba(249, 115, 22, 0.75)',
  weak: 'rgba(156, 163, 175, 0.5)',
}

const chartData = computed<ChartData<'scatter'>>(() => ({
  datasets: [
    {
      label: 'Pages',
      data: props.points.map(p => ({ x: p.x, y: p.y })),
      backgroundColor: props.points.map(p => COLORS[p.quadrant]),
      pointRadius: 5,
      pointHoverRadius: 7,
    },
  ],
}))

const options = computed<ChartOptions<'scatter'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: { display: !!props.xLabel, text: props.xLabel, font: { size: 11 }, color: '#6b7280' },
      ticks: { font: { size: 10 }, color: '#9ca3af' },
      grid: { color: '#f3f4f6' },
      border: { display: false },
    },
    y: {
      title: { display: !!props.yLabel, text: props.yLabel, font: { size: 11 }, color: '#6b7280' },
      ticks: {
        font: { size: 10 },
        color: '#9ca3af',
        callback: (v) => `${v}${props.ySuffix ?? ''}`,
      },
      grid: { color: '#f3f4f6' },
      border: { display: false },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const p = props.points[ctx.dataIndex]
          const label = p.label.length > 45 ? p.label.slice(0, 42) + '…' : p.label
          return [`  ${label}`, `  Sessions: ${p.x.toLocaleString()}`, `  Engagement: ${p.y.toFixed(1)}%`]
        },
      },
    },
  },
}))

// Custom plugin: draw dashed median lines
const quadrantPlugin: Plugin<'scatter'> = {
  id: 'quadrantLines',
  afterDraw(chart) {
    const { ctx, scales, chartArea } = chart
    if (!scales.x || !scales.y) return
    const medX = scales.x.getPixelForValue(props.medianX)
    const medY = scales.y.getPixelForValue(props.medianY)

    ctx.save()
    ctx.strokeStyle = 'rgba(107, 114, 128, 0.45)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 4])

    // Vertical median line
    ctx.beginPath()
    ctx.moveTo(medX, chartArea.top)
    ctx.lineTo(medX, chartArea.bottom)
    ctx.stroke()

    // Horizontal median line
    ctx.beginPath()
    ctx.moveTo(chartArea.left, medY)
    ctx.lineTo(chartArea.right, medY)
    ctx.stroke()

    ctx.restore()
  },
}
</script>
