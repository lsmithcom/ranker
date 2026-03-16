<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-xl font-semibold mb-4">GA4 Analytics</h1>
    <Ga4SubNav />

    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <select v-model="selectedPropertyId" class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
        <option value="">Select property…</option>
        <option v-for="p in properties" :key="p._id" :value="p._id">{{ p.propertyName }}</option>
      </select>
      <div class="flex rounded overflow-hidden border border-gray-300">
        <button v-for="r in ranges" :key="r.value" @click="range = r.value"
          class="px-3 py-1.5 text-sm transition-colors"
          :class="range === r.value ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'">
          {{ r.label }}
        </button>
      </div>
      <span v-if="loading" class="text-sm text-gray-400">Loading…</span>
      <span v-if="error" class="text-sm text-red-600">{{ error }}</span>
    </div>

    <template v-if="pages.length">

      <!-- Fresh pull notice -->
      <div v-if="needsPull" class="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded px-4 py-3 mb-6">
        Some metrics (Entrances, Exit Rate, Scroll Depth, Conversions) are empty — run a fresh GA4 pull on the
        <NuxtLink to="/import" class="underline">Import</NuxtLink> page to populate them.
      </div>

      <!-- ── Summary KPIs ─────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div class="bg-white shadow-sm rounded p-3 text-center">
          <div class="text-lg font-semibold text-gray-800">{{ totalViews.toLocaleString() }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Total Views</div>
        </div>
        <div class="bg-white shadow-sm rounded p-3 text-center">
          <div class="text-lg font-semibold text-gray-800">{{ totalSessions.toLocaleString() }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Total Sessions</div>
        </div>
        <div class="bg-white shadow-sm rounded p-3 text-center">
          <div class="text-lg font-semibold text-gray-800">{{ pages.length.toLocaleString() }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Unique Pages</div>
        </div>
        <div class="bg-white shadow-sm rounded p-3 text-center">
          <div class="text-lg font-semibold text-gray-800">{{ pagesPerSession.toFixed(2) }}</div>
          <div class="text-xs text-gray-400 mt-0.5">Pages / Session</div>
        </div>
        <div class="bg-white shadow-sm rounded p-3 text-center">
          <div class="text-lg font-semibold" :class="avgEngagement >= 60 ? 'text-green-600' : avgEngagement >= 40 ? 'text-amber-600' : 'text-red-500'">
            {{ avgEngagement.toFixed(1) }}%
          </div>
          <div class="text-xs text-gray-400 mt-0.5">Avg Engagement</div>
        </div>
      </div>

      <!-- ── D2 Content Health Tiers ──────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-3">Content Health</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white shadow-sm rounded-lg p-5 border-l-4 border-green-500">
            <div class="flex items-start justify-between">
              <div>
                <div class="text-3xl font-bold text-gray-900">{{ contentHealthTiers.strong }}</div>
                <div class="text-sm font-medium text-green-700 mt-0.5">Strong Pages</div>
                <div class="text-xs text-gray-400 mt-1">≥ 60% engagement rate</div>
              </div>
              <div class="text-xs text-gray-400 text-right mt-1">
                {{ totalPages > 0 ? ((contentHealthTiers.strong / totalPages) * 100).toFixed(0) : 0 }}%
                <div class="text-gray-300">of pages</div>
              </div>
            </div>
            <div class="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-green-500 rounded-full" :style="{ width: `${totalPages > 0 ? (contentHealthTiers.strong / totalPages) * 100 : 0}%` }"></div>
            </div>
          </div>
          <div class="bg-white shadow-sm rounded-lg p-5 border-l-4 border-amber-400">
            <div class="flex items-start justify-between">
              <div>
                <div class="text-3xl font-bold text-gray-900">{{ contentHealthTiers.fair }}</div>
                <div class="text-sm font-medium text-amber-700 mt-0.5">Fair Pages</div>
                <div class="text-xs text-gray-400 mt-1">35%–60% engagement</div>
              </div>
              <div class="text-xs text-gray-400 text-right mt-1">
                {{ totalPages > 0 ? ((contentHealthTiers.fair / totalPages) * 100).toFixed(0) : 0 }}%
                <div class="text-gray-300">of pages</div>
              </div>
            </div>
            <div class="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-amber-400 rounded-full" :style="{ width: `${totalPages > 0 ? (contentHealthTiers.fair / totalPages) * 100 : 0}%` }"></div>
            </div>
          </div>
          <div class="bg-white shadow-sm rounded-lg p-5 border-l-4 border-red-400">
            <div class="flex items-start justify-between">
              <div>
                <div class="text-3xl font-bold text-gray-900">{{ contentHealthTiers.weak }}</div>
                <div class="text-sm font-medium text-red-700 mt-0.5">Weak Pages</div>
                <div class="text-xs text-gray-400 mt-1">&lt; 35% engagement rate</div>
              </div>
              <div class="text-xs text-gray-400 text-right mt-1">
                {{ totalPages > 0 ? ((contentHealthTiers.weak / totalPages) * 100).toFixed(0) : 0 }}%
                <div class="text-gray-300">of pages</div>
              </div>
            </div>
            <div class="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-red-400 rounded-full" :style="{ width: `${totalPages > 0 ? (contentHealthTiers.weak / totalPages) * 100 : 0}%` }"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── D3 Traffic Concentration Risk ───────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-3">Traffic Concentration Risk</h2>
        <div class="bg-white shadow-sm rounded-lg p-5">
          <p class="text-xs text-gray-500 mb-4">A site where most traffic comes from just a few pages is vulnerable if those pages drop in rankings.</p>
          <div class="grid grid-cols-3 gap-6 mb-5">
            <div class="text-center">
              <div class="text-3xl font-bold tabular-nums" :class="concentration.top1Pct > 40 ? 'text-red-500' : concentration.top1Pct > 25 ? 'text-amber-600' : 'text-green-600'">
                {{ concentration.top1Pct.toFixed(0) }}%
              </div>
              <div class="text-xs text-gray-400 mt-1">Top 1 page</div>
              <div class="text-xs text-gray-300">{{ concentration.top1Sessions.toLocaleString() }} sessions</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold tabular-nums" :class="concentration.top5Pct > 70 ? 'text-red-500' : concentration.top5Pct > 50 ? 'text-amber-600' : 'text-green-600'">
                {{ concentration.top5Pct.toFixed(0) }}%
              </div>
              <div class="text-xs text-gray-400 mt-1">Top 5 pages</div>
              <div class="text-xs text-gray-300">{{ concentration.top5Sessions.toLocaleString() }} sessions</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold tabular-nums" :class="concentration.top10Pct > 85 ? 'text-red-500' : concentration.top10Pct > 65 ? 'text-amber-600' : 'text-green-600'">
                {{ concentration.top10Pct.toFixed(0) }}%
              </div>
              <div class="text-xs text-gray-400 mt-1">Top 10 pages</div>
              <div class="text-xs text-gray-300">{{ concentration.top10Sessions.toLocaleString() }} sessions</div>
            </div>
          </div>
          <div class="space-y-2">
            <div v-for="p in concentration.topPages" :key="p.pagePath" class="flex items-center gap-3 text-xs">
              <span class="text-gray-500 truncate w-64 font-mono" :title="p.pagePath">{{ p.pagePath }}</span>
              <div class="flex-1 bg-gray-100 rounded-full overflow-hidden h-4">
                <div class="h-full bg-indigo-400 rounded-full flex items-center pl-2 text-white font-medium"
                  :style="{ width: `${Math.max(p.pct, 3)}%` }">
                  {{ p.sessions.toLocaleString() }}
                </div>
              </div>
              <span class="text-gray-400 w-10 text-right">{{ p.pct.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── A4 Page Performance Scatter ─────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">Page Performance Matrix</h2>
        <p class="text-xs text-gray-500 mb-3">
          Each dot is a page plotted by sessions (x) × engagement rate (y). Dashed lines show medians.
          <span class="text-green-600 font-medium">Stars</span> = high traffic &amp; engagement •
          <span class="text-blue-600 font-medium">Underrated</span> = great content, low reach •
          <span class="text-orange-500 font-medium">Risky</span> = high traffic, poor engagement •
          <span class="text-gray-400 font-medium">Weak</span> = low on both.
        </p>
        <div class="bg-white shadow-sm rounded-lg p-4">
          <div class="flex flex-wrap gap-4 mb-3 text-xs">
            <span class="text-gray-500">Showing top {{ scatterPoints.length }} pages • Median sessions: <strong>{{ medianX.toLocaleString() }}</strong> • Median engagement: <strong>{{ medianY.toFixed(1) }}%</strong></span>
            <span class="text-green-700 font-medium">Stars: {{ quadrantCounts.star }}</span>
            <span class="text-blue-700 font-medium">Underrated: {{ quadrantCounts.underrated }}</span>
            <span class="text-orange-600 font-medium">Risky: {{ quadrantCounts.risky }}</span>
            <span class="text-gray-400 font-medium">Weak: {{ quadrantCounts.weak }}</span>
          </div>
          <div style="height: 380px">
            <ClientOnly>
              <AnalyticsScatter :points="scatterPoints" xLabel="Sessions" yLabel="Engagement Rate" ySuffix="%" :medianX="medianX" :medianY="medianY" />
            </ClientOnly>
          </div>
        </div>
      </section>

      <!-- ── B2 Landing & Exit Pages ──────────────────────────────────────── -->
      <section v-if="!needsPull" class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-3">Landing &amp; Exit Pages</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white shadow-sm rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100 bg-green-50">
              <h3 class="text-sm font-semibold text-green-800">↓ Top Landing Pages</h3>
              <p class="text-xs text-green-600 mt-0.5">Pages where most sessions begin (by Entrances)</p>
            </div>
            <table class="w-full text-xs">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-3 py-2 text-left font-medium text-gray-500">Page</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-500">Entrances</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-500">Engagement</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="p in landingPages" :key="p.pagePath" class="hover:bg-gray-50">
                  <td class="px-3 py-2 text-gray-600 font-mono truncate max-w-xs" :title="p.pagePath">{{ p.pagePath }}</td>
                  <td class="px-3 py-2 text-right font-medium text-green-700">{{ p.entrances.toLocaleString() }}</td>
                  <td class="px-3 py-2 text-right" :class="p.engagementRate >= 0.6 ? 'text-green-600' : p.engagementRate >= 0.35 ? 'text-amber-600' : 'text-red-500'">
                    {{ (p.engagementRate * 100).toFixed(0) }}%
                  </td>
                </tr>
                <tr v-if="!landingPages.length"><td colspan="3" class="px-3 py-6 text-center text-gray-400">No entrance data — pull needed</td></tr>
              </tbody>
            </table>
          </div>
          <div class="bg-white shadow-sm rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100 bg-red-50">
              <h3 class="text-sm font-semibold text-red-800">↑ Top Exit Pages</h3>
              <p class="text-xs text-red-600 mt-0.5">Pages with highest exit rate — investigate if key pages</p>
            </div>
            <table class="w-full text-xs">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-3 py-2 text-left font-medium text-gray-500">Page</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-500">Exit Rate</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-500">Views</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="p in exitPages" :key="p.pagePath" class="hover:bg-gray-50">
                  <td class="px-3 py-2 text-gray-600 font-mono truncate max-w-xs" :title="p.pagePath">{{ p.pagePath }}</td>
                  <td class="px-3 py-2 text-right font-medium" :class="p.exitRate >= 0.5 ? 'text-red-600' : p.exitRate >= 0.3 ? 'text-amber-600' : 'text-green-600'">
                    {{ (p.exitRate * 100).toFixed(1) }}%
                  </td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ p.screenPageViews.toLocaleString() }}</td>
                </tr>
                <tr v-if="!exitPages.length"><td colspan="3" class="px-3 py-6 text-center text-gray-400">No exit rate data — pull needed</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ── A7 Engagement Score ──────────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">Content Engagement Score</h2>
        <p class="text-xs text-gray-500 mb-3">Composite score: engagement rate (50%) + avg session duration score (30%) + sessions volume (20%). Higher = better overall content quality.</p>
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <table class="w-full text-xs">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-2.5 text-left font-medium text-gray-500 uppercase">Page</th>
                <th class="px-4 py-2.5 text-right font-medium text-gray-500 uppercase">Score</th>
                <th class="px-4 py-2.5 text-right font-medium text-gray-500 uppercase">Sessions</th>
                <th class="px-4 py-2.5 text-right font-medium text-gray-500 uppercase">Engagement</th>
                <th class="px-4 py-2.5 text-right font-medium text-gray-500 uppercase">Avg Duration</th>
                <th class="px-4 py-2.5 w-24 font-medium text-gray-500 uppercase">Quality</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="p in engagementScorePages" :key="p.pagePath"
                class="hover:bg-gray-50"
                :class="p.score >= 60 ? 'bg-green-50/50' : p.score >= 35 ? '' : 'bg-red-50/30'">
                <td class="px-4 py-2 text-gray-600 font-mono truncate max-w-xs" :title="p.pagePath">{{ p.pagePath }}</td>
                <td class="px-4 py-2 text-right">
                  <span class="font-bold text-sm" :class="p.score >= 60 ? 'text-green-700' : p.score >= 35 ? 'text-amber-600' : 'text-red-500'">
                    {{ p.score.toFixed(0) }}
                  </span>
                </td>
                <td class="px-4 py-2 text-right text-gray-700">{{ p.sessions.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right" :class="p.engagementRate >= 0.6 ? 'text-green-600' : p.engagementRate >= 0.35 ? 'text-amber-600' : 'text-red-500'">
                  {{ (p.engagementRate * 100).toFixed(1) }}%
                </td>
                <td class="px-4 py-2 text-right text-gray-600">{{ formatDuration(p.avgSessionDurationSec) }}</td>
                <td class="px-4 py-2">
                  <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full" :class="p.score >= 60 ? 'bg-green-500' : p.score >= 35 ? 'bg-amber-400' : 'bg-red-400'"
                      :style="{ width: `${p.score}%` }"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── B3 Scroll Depth ──────────────────────────────────────────────── -->
      <section v-if="!needsPull" class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-1">Scroll Depth by Page</h2>
        <p class="text-xs text-gray-500 mb-3">Users who scrolled past 90% of the page. High views + low scroll depth = content failing to engage — prioritise these pages for improvement.</p>
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <table class="w-full text-xs">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-2.5 text-left font-medium text-gray-500 uppercase">Page</th>
                <th class="px-4 py-2.5 text-right font-medium text-gray-500 uppercase">Users</th>
                <th class="px-4 py-2.5 text-right font-medium text-gray-500 uppercase">Scrolled</th>
                <th class="px-4 py-2.5 text-right font-medium text-gray-500 uppercase">Scroll Rate</th>
                <th class="px-4 py-2.5 w-28 font-medium text-gray-500 uppercase">Bar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="p in scrollDepthPages" :key="p.pagePath" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-600 font-mono truncate max-w-xs" :title="p.pagePath">{{ p.pagePath }}</td>
                <td class="px-4 py-2 text-right text-gray-700">{{ p.users.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-gray-700">{{ p.scrolledUsers.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right font-medium" :class="p.scrollRate >= 50 ? 'text-green-600' : p.scrollRate >= 25 ? 'text-amber-600' : 'text-red-500'">
                  {{ p.scrollRate.toFixed(1) }}%
                </td>
                <td class="px-4 py-2">
                  <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full" :class="p.scrollRate >= 50 ? 'bg-green-500' : p.scrollRate >= 25 ? 'bg-amber-400' : 'bg-red-400'"
                      :style="{ width: `${Math.min(p.scrollRate, 100)}%` }"></div>
                  </div>
                </td>
              </tr>
              <tr v-if="!scrollDepthPages.length">
                <td colspan="5" class="px-4 py-6 text-center text-gray-400">No scroll data — run a fresh GA4 pull.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── Full Pages Table ─────────────────────────────────────────────── -->
      <section class="mb-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 class="text-base font-semibold text-gray-800">All Pages</h2>
          <div class="flex items-center gap-2">
            <select v-model="sortField" class="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none">
              <option value="screenPageViews">Sort: Views</option>
              <option value="sessions">Sort: Sessions</option>
              <option value="users">Sort: Users</option>
              <option value="bounceRate">Sort: Bounce Rate</option>
              <option value="engagementRate">Sort: Engagement</option>
              <option value="avgSessionDurationSec">Sort: Duration</option>
            </select>
            <input v-model="search" type="text" placeholder="Filter paths…"
              class="border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none w-44" />
          </div>
        </div>
        <div class="bg-white shadow-sm rounded overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Path</th>
                  <th v-for="col in columns" :key="col.field"
                    class="text-right px-4 py-2.5 text-xs font-medium uppercase cursor-pointer select-none whitespace-nowrap"
                    :class="sortField === col.field ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'"
                    @click="sortField = col.field">
                    {{ col.label }}{{ sortField === col.field ? ' ↓' : '' }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in filteredPages" :key="row.pagePath" class="hover:bg-gray-50">
                  <td class="px-4 py-2">
                    <div class="truncate max-w-xs" :title="row.pagePath">{{ row.pagePath }}</div>
                    <div v-if="row.pageTitle" class="text-xs text-gray-400 truncate max-w-xs">{{ row.pageTitle }}</div>
                  </td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ row.screenPageViews.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ row.sessions.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ row.users.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ row.newUsers.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right" :class="row.bounceRate * 100 >= 70 ? 'text-red-600' : row.bounceRate * 100 >= 50 ? 'text-amber-600' : 'text-green-600'">
                    {{ (row.bounceRate * 100).toFixed(1) }}%
                  </td>
                  <td class="px-4 py-2 text-right" :class="row.engagementRate * 100 >= 60 ? 'text-green-600' : row.engagementRate * 100 >= 40 ? 'text-amber-600' : 'text-red-600'">
                    {{ (row.engagementRate * 100).toFixed(1) }}%
                  </td>
                  <td class="px-4 py-2 text-right text-gray-800">{{ formatDuration(row.avgSessionDurationSec) }}</td>
                </tr>
                <tr v-if="!filteredPages.length">
                  <td colspan="8" class="px-4 py-8 text-center text-gray-400">No pages match your filter.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </template>

    <div v-else-if="loading" class="text-center py-16 text-gray-400 text-sm">Loading…</div>
    <div v-else-if="!selectedPropertyId" class="text-center py-16 text-gray-400 text-sm">Select a property above.</div>
    <div v-else class="text-center py-16 text-gray-400 text-sm">No page data. Try a different range or pull data from the <NuxtLink to="/import" class="text-indigo-600 underline">Import</NuxtLink> page.</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Property { _id: string; propertyName: string }
interface PageMetric {
  pagePath: string
  pageTitle: string
  screenPageViews: number
  sessions: number
  users: number
  newUsers: number
  bounceRate: number
  avgSessionDurationSec: number
  engagementRate: number
  entrances: number
  exitRate: number
  scrolledUsers: number
  conversions: number
}

const ranges = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]
const columns = [
  { label: 'Views', field: 'screenPageViews' },
  { label: 'Sessions', field: 'sessions' },
  { label: 'Users', field: 'users' },
  { label: 'New Users', field: 'newUsers' },
  { label: 'Bounce Rate', field: 'bounceRate' },
  { label: 'Engagement', field: 'engagementRate' },
  { label: 'Avg Duration', field: 'avgSessionDurationSec' },
]

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const range = ref('30d')
const sortField = ref('screenPageViews')
const search = ref('')
const loading = ref(false)
const error = ref('')
const pages = ref<PageMetric[]>([])

// ── Derived metrics ────────────────────────────────────────────────────────
const totalPages = computed(() => pages.value.length)
const totalViews = computed(() => pages.value.reduce((s, p) => s + p.screenPageViews, 0))
const totalSessions = computed(() => pages.value.reduce((s, p) => s + p.sessions, 0))
const avgEngagement = computed(() => {
  if (!pages.value.length) return 0
  return pages.value.reduce((s, p) => s + p.engagementRate, 0) / pages.value.length * 100
})
const pagesPerSession = computed(() =>
  totalSessions.value > 0 ? totalViews.value / totalSessions.value : 0
)

// Detect if new fields are empty (old data, needs re-pull)
const needsPull = computed(() =>
  pages.value.length > 0 && pages.value.every(p => p.entrances === 0 && p.scrolledUsers === 0)
)

// D2: Content health tiers
const contentHealthTiers = computed(() => ({
  strong: pages.value.filter(p => p.engagementRate >= 0.6).length,
  fair: pages.value.filter(p => p.engagementRate >= 0.35 && p.engagementRate < 0.6).length,
  weak: pages.value.filter(p => p.engagementRate < 0.35).length,
}))

// D3: Traffic concentration
const concentration = computed(() => {
  const sorted = [...pages.value].sort((a, b) => b.sessions - a.sessions)
  const total = totalSessions.value
  const top1 = sorted[0]?.sessions ?? 0
  const top5 = sorted.slice(0, 5).reduce((s, p) => s + p.sessions, 0)
  const top10 = sorted.slice(0, 10).reduce((s, p) => s + p.sessions, 0)
  return {
    top1Pct: total > 0 ? (top1 / total) * 100 : 0,
    top5Pct: total > 0 ? (top5 / total) * 100 : 0,
    top10Pct: total > 0 ? (top10 / total) * 100 : 0,
    top1Sessions: top1,
    top5Sessions: top5,
    top10Sessions: top10,
    topPages: sorted.slice(0, 10).map(p => ({
      pagePath: p.pagePath,
      sessions: p.sessions,
      pct: total > 0 ? (p.sessions / total) * 100 : 0,
    })),
  }
})

// A4: Scatter plot
function median(arr: number[]): number {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
const medianX = computed(() => median(pages.value.map(p => p.sessions)))
const medianY = computed(() => median(pages.value.map(p => p.engagementRate * 100)))
const scatterPoints = computed(() =>
  pages.value.slice(0, 200).map(p => {
    const x = p.sessions
    const y = p.engagementRate * 100
    const aboveX = x >= medianX.value
    const aboveY = y >= medianY.value
    const quadrant: 'star' | 'underrated' | 'risky' | 'weak' =
      aboveX && aboveY ? 'star' : !aboveX && aboveY ? 'underrated' : aboveX && !aboveY ? 'risky' : 'weak'
    return { x, y, label: p.pagePath, quadrant }
  })
)
const quadrantCounts = computed(() => {
  const c = { star: 0, underrated: 0, risky: 0, weak: 0 }
  for (const p of scatterPoints.value) c[p.quadrant]++
  return c
})

// B2: Landing & exit pages
const landingPages = computed(() =>
  [...pages.value].filter(p => p.entrances > 0).sort((a, b) => b.entrances - a.entrances).slice(0, 15)
)
const exitPages = computed(() =>
  [...pages.value].filter(p => p.screenPageViews >= 10).sort((a, b) => b.exitRate - a.exitRate).slice(0, 15)
)

// A7: Engagement score
const maxSessions = computed(() => Math.max(...pages.value.map(p => p.sessions), 1))
const engagementScorePages = computed(() =>
  pages.value.map(p => ({
    ...p,
    score: (p.engagementRate * 50) + (Math.min(p.avgSessionDurationSec / 300, 1) * 30) + ((p.sessions / maxSessions.value) * 20),
  })).sort((a, b) => b.score - a.score).slice(0, 20)
)

// B3: Scroll depth
const scrollDepthPages = computed(() =>
  pages.value
    .filter(p => p.users > 0)
    .map(p => ({ ...p, scrollRate: p.users > 0 ? (p.scrolledUsers / p.users) * 100 : 0 }))
    .sort((a, b) => b.screenPageViews - a.screenPageViews)
    .slice(0, 20)
)

// Filtered/sorted table
const filteredPages = computed(() => {
  let list = [...pages.value]
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(p => p.pagePath.toLowerCase().includes(q))
  }
  list.sort((a, b) => (b[sortField.value as keyof PageMetric] as number) - (a[sortField.value as keyof PageMetric] as number))
  return list
})

watch([selectedPropertyId, range], () => { if (selectedPropertyId.value) load() })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: PageMetric[] }>(
      `/api/ga4/page-metrics?propertyId=${selectedPropertyId.value}&range=${range.value}&limit=500`
    )
    pages.value = res.data
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    error.value = e?.data?.message || 'Failed to load'
  } finally {
    loading.value = false
  }
}

async function loadProperties() {
  try {
    const res = await $fetch<{ data: Property[] }>('/api/properties')
    properties.value = res.data
    if (properties.value.length === 1) {
      selectedPropertyId.value = properties.value[0]._id
    }
  } catch { }
}

function formatDuration(sec: number): string {
  if (!sec) return '0s'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

onMounted(loadProperties)
</script>
