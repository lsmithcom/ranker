<template>
  <div class="bg-white border border-gray-200 rounded-lg p-5">
    <h3 class="text-sm font-semibold text-gray-800 mb-4">{{ title }}</h3>
    <div v-if="!data.length" class="grid grid-cols-2 gap-3">
      <div
        v-for="i in 6"
        :key="i"
        class="bg-gray-50 rounded-lg h-24 animate-pulse"
      />
    </div>
    <div v-else class="grid grid-cols-2 gap-3">
      <DistributionMiniChart
        v-for="bucket in buckets"
        :key="bucket.key"
        :label="bucket.label"
        :labels="labels"
        :values="bucket.values"
        :color="bucket.color"
        :fill-color="bucket.fillColor"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface DistributionPoint {
  date: string
  top1: number
  top2_5: number
  top5_10: number
  top10_20: number
  top20_50: number
  top50_100: number
}

const props = defineProps<{
  title: string
  labels: string[]
  data: DistributionPoint[]
}>()

const buckets = computed(() => [
  {
    key: 'top1',
    label: 'Top 1',
    color: '#5B8A6E',
    fillColor: 'rgba(91,138,110,0.10)',
    values: props.data.map((d) => d.top1),
  },
  {
    key: 'top2_5',
    label: 'Top 2–5',
    color: '#6EA8A0',
    fillColor: 'rgba(110,168,160,0.10)',
    values: props.data.map((d) => d.top2_5),
  },
  {
    key: 'top5_10',
    label: 'Top 5–10',
    color: '#7B9ED0',
    fillColor: 'rgba(123,158,208,0.10)',
    values: props.data.map((d) => d.top5_10),
  },
  {
    key: 'top10_20',
    label: 'Top 10–20',
    color: '#9E84B8',
    fillColor: 'rgba(158,132,184,0.10)',
    values: props.data.map((d) => d.top10_20),
  },
  {
    key: 'top20_50',
    label: 'Top 20–50',
    color: '#C4956A',
    fillColor: 'rgba(196,149,106,0.10)',
    values: props.data.map((d) => d.top20_50),
  },
  {
    key: 'top50_100',
    label: 'Top 50–100',
    color: '#A0A0B0',
    fillColor: 'rgba(160,160,176,0.10)',
    values: props.data.map((d) => d.top50_100),
  },
])
</script>
