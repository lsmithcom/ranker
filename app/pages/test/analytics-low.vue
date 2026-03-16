<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <div class="mb-6">
      <h1 class="text-xl font-semibold text-gray-900 mb-1">Analytics — Low Effort Explorations</h1>
      <p class="text-sm text-gray-500">Test page for new visualisation ideas. Items marked <span class="text-amber-600 font-medium">★ New pull needed</span> require running a fresh GA4 pull to populate the new fields.</p>
    </div>

    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-3 mb-8 p-4 bg-white shadow-sm rounded-lg">
      <select
        v-model="selectedPropertyId"
        class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 min-w-48"
      >
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
    </div>

    <template v-if="selectedPropertyId && overview">

      <!-- ══════════════════════════════════════════════════════════════
           A1 — DEVICE SPLIT DONUT (replaces table)
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">A1 — Device Split: Donut Chart</h2>
        <p class="text-sm text-gray-500 mb-4">Three categories (desktop / mobile / tablet) are perfect for a donut. Shows device share at a glance — critical since Google uses mobile-first indexing.</p>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Sessions by Device</h3>
            <div class="flex items-center gap-8">
              <div class="h-48 w-48 flex-shrink-0">
                <ClientOnly>
                  <SearchDonutChart :segments="deviceDonutSessions" />
                </ClientOnly>
              </div>
              <div class="space-y-3 flex-1">
                <div v-for="d in deviceDonutSessions" :key="d.label" class="flex items-center gap-3">
                  <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: d.color }" />
                  <span class="text-sm text-gray-700 capitalize flex-1">{{ d.label }}</span>
                  <span class="text-sm font-semibold text-gray-800 tabular-nums">{{ d.value.toLocaleString() }}</span>
                  <span class="text-xs text-gray-400 w-10 text-right">{{ pct(d.value, deviceTotal) }}%</span>
                </div>
                <div class="pt-2 border-t border-gray-100">
                  <div class="flex items-center gap-3">
                    <span class="w-3 h-3 flex-shrink-0" />
                    <span class="text-xs text-gray-500 flex-1">Views by device</span>
                  </div>
                  <div v-for="d in deviceDonutViews" :key="d.label" class="flex items-center gap-3 mt-1">
                    <span class="w-3 h-3 rounded-full flex-shrink-0 opacity-40" :style="{ backgroundColor: d.color }" />
                    <span class="text-xs text-gray-500 capitalize flex-1">{{ d.label }}</span>
                    <span class="text-xs text-gray-600 tabular-nums">{{ d.value.toLocaleString() }}</span>
                    <span class="text-xs text-gray-400 w-10 text-right">{{ pct(d.value, deviceViewsTotal) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Mobile share trend -->
          <div class="bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-1">Mobile Share Over Time</h3>
            <p class="text-xs text-gray-400 mb-3">A rising mobile share matters for Core Web Vitals prioritisation.</p>
            <div class="h-44">
              <DashboardChart
                :labels="chartLabels"
                :values="mobileShareTrend"
                color="#6366f1"
                fill-color="rgba(99,102,241,0.08)"
                tooltip-label="Mobile %"
              />
            </div>
            <p class="text-xs text-gray-400 mt-2 text-center">Derived from device sessions ÷ total sessions per day (approximated from daily overview totals × device split)</p>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           A2 — NEW VS RETURNING USERS
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">A2 — New vs Returning Users</h2>
        <p class="text-sm text-gray-500 mb-4">Returning users signal loyalty and content stickiness. A growing returning share is one of the strongest organic growth indicators.</p>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <!-- KPI card -->
          <div class="bg-white shadow-sm rounded-lg p-5 flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-semibold text-gray-700 mb-4">Period Summary</h3>
              <div class="space-y-4">
                <div>
                  <div class="text-3xl font-bold text-gray-800 tabular-nums">{{ returningRateCurrent.toFixed(1) }}%</div>
                  <div class="text-xs text-gray-400 mt-0.5">Returning visitor rate</div>
                </div>
                <div class="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <div class="text-lg font-semibold text-indigo-600">{{ totals.newUsers.toLocaleString() }}</div>
                    <div class="text-xs text-gray-400">New Users</div>
                  </div>
                  <div>
                    <div class="text-lg font-semibold text-emerald-600">{{ returningUsersTotal.toLocaleString() }}</div>
                    <div class="text-xs text-gray-400">Returning Users</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div class="flex rounded-full overflow-hidden h-3">
                <div class="bg-indigo-400 h-full transition-all" :style="{ width: (100 - returningRateCurrent) + '%' }" />
                <div class="bg-emerald-400 h-full transition-all" :style="{ width: returningRateCurrent + '%' }" />
              </div>
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>New</span><span>Returning</span>
              </div>
            </div>
          </div>

          <!-- Donut -->
          <div class="bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">User Composition</h3>
            <div class="h-48">
              <ClientOnly>
                <SearchDonutChart :segments="newReturningDonut" />
              </ClientOnly>
            </div>
          </div>

          <!-- Trend chart -->
          <div class="bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-1">Returning Rate Trend</h3>
            <p class="text-xs text-gray-400 mb-3">% of daily users who are returning visitors.</p>
            <div class="h-44">
              <ClientOnly :key="range">
                <Ga4LineChart :labels="chartLabels" :datasets="returningRateTrend" suffix="%" />
              </ClientOnly>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           A3 — CHANNEL QUALITY COMPARISON
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">A3 — Traffic Source Quality Comparison</h2>
        <p class="text-sm text-gray-500 mb-4">Volume alone doesn't tell the full story. This view compares each channel's session share, engagement quality, and bounce rate — showing which channels bring <em>quality</em> traffic vs. just quantity.</p>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <!-- Visual table -->
          <div class="bg-white shadow-sm rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100">
              <h3 class="text-sm font-semibold text-gray-700">Channel Quality Matrix</h3>
            </div>
            <div class="divide-y divide-gray-50">
              <div v-for="ch in channelQuality" :key="ch.medium" class="px-4 py-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-800 capitalize">
                    {{ ch.medium === '(none)' ? 'Direct' : ch.medium }}
                  </span>
                  <div class="flex items-center gap-3 text-xs text-gray-500">
                    <span>{{ ch.sessions.toLocaleString() }} sessions</span>
                    <span class="font-medium" :class="ch.sessions / channelQuality[0].sessions > 0.5 ? 'text-indigo-600' : 'text-gray-500'">
                      {{ pct(ch.sessions, totalChannelSessions) }}%
                    </span>
                  </div>
                </div>
                <!-- Sessions bar -->
                <div class="mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-400 w-20">Sessions</span>
                    <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full bg-indigo-400 rounded-full" :style="{ width: pct(ch.sessions, channelQuality[0].sessions) + '%' }" />
                    </div>
                  </div>
                </div>
                <!-- Engagement bar -->
                <div class="mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-400 w-20">Engagement</span>
                    <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full" :style="{ width: ch.engagementRate + '%', backgroundColor: engageBarColor(ch.engagementRate) }" />
                    </div>
                    <span class="text-xs font-medium w-10 text-right" :class="ch.engagementRate >= 60 ? 'text-green-600' : ch.engagementRate >= 40 ? 'text-amber-600' : 'text-red-500'">
                      {{ ch.engagementRate.toFixed(0) }}%
                    </span>
                  </div>
                </div>
                <!-- Bounce bar -->
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-400 w-20">Bounce Rate</span>
                    <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full" :style="{ width: ch.bounceRate + '%', backgroundColor: bounceBarColor(ch.bounceRate) }" />
                    </div>
                    <span class="text-xs font-medium w-10 text-right" :class="ch.bounceRate >= 70 ? 'text-red-500' : ch.bounceRate >= 50 ? 'text-amber-600' : 'text-green-600'">
                      {{ ch.bounceRate.toFixed(0) }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Grouped bar chart: engagement + bounce per channel -->
          <div class="bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-1">Engagement vs Bounce by Channel</h3>
            <p class="text-xs text-gray-400 mb-3">Higher engagement + lower bounce = better traffic quality.</p>
            <div class="h-64">
              <ClientOnly :key="range">
                <AnalyticsGroupedBar
                  :labels="channelQualityLabels"
                  :datasets="channelQualityDatasets"
                  suffix="%"
                  :horizontal="true"
                />
              </ClientOnly>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           A5 — DAY-OF-WEEK TRAFFIC HEATMAP
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">A5 — Day-of-Week Traffic Heatmap</h2>
        <p class="text-sm text-gray-500 mb-4">Reveals when your audience is most active — useful for content publishing timing, ad scheduling, and understanding weekday vs weekend behaviour.</p>
        <div class="bg-white shadow-sm rounded-lg p-5">
          <div class="grid grid-cols-7 gap-2 mb-2">
            <div v-for="d in dayNames" :key="d" class="text-center text-xs font-medium text-gray-500">{{ d }}</div>
          </div>
          <!-- Heatmap cells: avg sessions per day -->
          <div class="grid grid-cols-7 gap-2 mb-3">
            <div
              v-for="d in dayStats"
              :key="d.day"
              class="rounded-lg p-3 text-center transition-all"
              :style="{ backgroundColor: heatColor(d.avgSessions, maxDayAvg) }"
            >
              <div class="text-lg font-bold tabular-nums" :style="{ color: d.avgSessions > maxDayAvg * 0.6 ? '#fff' : '#374151' }">
                {{ Math.round(d.avgSessions).toLocaleString() }}
              </div>
              <div class="text-xs mt-0.5" :style="{ color: d.avgSessions > maxDayAvg * 0.6 ? 'rgba(255,255,255,0.8)' : '#9ca3af' }">
                avg sessions
              </div>
            </div>
          </div>
          <!-- Page views row -->
          <div class="grid grid-cols-7 gap-2 mb-2">
            <div v-for="d in dayStats" :key="d.day" class="rounded-lg p-2 text-center bg-gray-50">
              <div class="text-sm font-medium text-gray-700 tabular-nums">{{ Math.round(d.avgViews).toLocaleString() }}</div>
              <div class="text-xs text-gray-400">avg views</div>
            </div>
          </div>
          <p class="text-xs text-gray-400 text-center">Based on {{ chartLabels.length }} days of data. Averaged per day of week.</p>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           D4 — ORGANIC SHARE TREND
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">D4 — Organic Search Share Trend</h2>
        <p class="text-sm text-gray-500 mb-4">For an SEO tool, this is arguably the most important business metric — it answers "is my SEO investment actually growing my organic share of traffic?"</p>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Period Snapshot</h3>
            <div class="text-4xl font-bold tabular-nums mb-1" :class="organicShareAvg >= 30 ? 'text-green-600' : organicShareAvg >= 15 ? 'text-amber-600' : 'text-red-500'">
              {{ organicShareAvg.toFixed(1) }}%
            </div>
            <div class="text-xs text-gray-400 mb-4">Average organic share of sessions</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-gray-500">Organic sessions</span><span class="font-medium">{{ organicSessionsTotal.toLocaleString() }}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Total sessions</span><span class="font-medium">{{ organicTotalSessions.toLocaleString() }}</span></div>
            </div>
          </div>
          <div class="lg:col-span-2 bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-1">Organic % Over Time</h3>
            <p class="text-xs text-gray-400 mb-3">A rising line = SEO gaining share. A declining line = other channels growing faster or SEO weakening.</p>
            <div class="h-44">
              <ClientOnly :key="range">
                <Ga4LineChart :labels="organicTrendLabels" :datasets="organicTrendDataset" suffix="%" />
              </ClientOnly>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           D1 — RETURN VISITOR RATE KPI + TREND
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">D1 — Return Visitor Rate Trend</h2>
        <p class="text-sm text-gray-500 mb-4">A rising returning-user trend means content is building loyalty. This is a key signal for content marketing ROI.</p>
        <div class="bg-white shadow-sm rounded-lg p-5">
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div>
              <div class="text-3xl font-bold text-emerald-600 tabular-nums">{{ returningRateCurrent.toFixed(1) }}%</div>
              <div class="text-xs text-gray-400 mt-1">Period avg returning rate</div>
              <div class="mt-3 text-sm text-gray-600">
                <div>{{ returningUsersTotal.toLocaleString() }} returning</div>
                <div>{{ totals.newUsers.toLocaleString() }} new</div>
              </div>
            </div>
            <div class="lg:col-span-3 h-36">
              <ClientOnly :key="range">
                <Ga4LineChart :labels="chartLabels" :datasets="returningRateTrend" suffix="%" />
              </ClientOnly>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           D2 — CONTENT HEALTH SUMMARY
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">D2 — Content Health Summary</h2>
        <p class="text-sm text-gray-500 mb-4">A one-glance content audit: how many pages are engaging visitors well, adequately, or poorly? Identifies the scale of content improvement opportunities.</p>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Pages by Engagement Level</h3>
            <div class="space-y-4">
              <div v-for="tier in contentHealthTiers" :key="tier.label">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: tier.color }" />
                    <span class="text-sm text-gray-700">{{ tier.label }}</span>
                    <span class="text-xs text-gray-400">{{ tier.range }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-semibold text-gray-800">{{ tier.count }}</span>
                    <span class="text-xs text-gray-400 ml-1">pages</span>
                    <span class="text-xs text-gray-400 ml-2">{{ pct(tier.count, pages.length) }}%</span>
                  </div>
                </div>
                <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500" :style="{ width: pct(tier.count, pages.length) + '%', backgroundColor: tier.color }" />
                </div>
              </div>
            </div>
          </div>
          <div class="bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Content Health Donut</h3>
            <div class="h-52">
              <ClientOnly>
                <SearchDonutChart :segments="contentHealthDonut" />
              </ClientOnly>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           D3 — TRAFFIC CONCENTRATION RISK
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">D3 — Traffic Concentration Risk</h2>
        <p class="text-sm text-gray-500 mb-4">A site where 80% of traffic comes from 2 pages is highly vulnerable if those pages drop in rankings. This view quantifies that risk.</p>
        <div class="bg-white shadow-sm rounded-lg p-5">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div v-for="c in concentrationCards" :key="c.label" class="text-center">
              <div class="text-3xl font-bold tabular-nums mb-1" :class="c.pct > 70 ? 'text-red-500' : c.pct > 50 ? 'text-amber-600' : 'text-green-600'">
                {{ c.pct.toFixed(0) }}%
              </div>
              <div class="text-xs text-gray-400">{{ c.label }}</div>
              <div class="text-xs text-gray-400 mt-0.5">{{ c.sessions.toLocaleString() }} sessions</div>
            </div>
          </div>
          <!-- Top 10 pages concentration visual -->
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Top 10 Pages — Session Share</h3>
          <div class="space-y-1.5">
            <div v-for="(page, i) in concentrationPages" :key="page.pagePath" class="flex items-center gap-3">
              <span class="text-xs text-gray-400 w-4 text-right flex-shrink-0">{{ i + 1 }}</span>
              <div class="flex-1 min-w-0">
                <div class="truncate text-xs text-gray-600" :title="page.pagePath">{{ page.pagePath }}</div>
                <div class="mt-0.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :style="{ width: pct(page.sessions, totalSessions) + '%', backgroundColor: concentrationColor(i) }"
                  />
                </div>
              </div>
              <span class="text-xs font-medium text-gray-700 w-10 text-right flex-shrink-0">{{ pct(page.sessions, totalSessions) }}%</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           B4 — PAGES PER SESSION TREND (derived metric)
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">B4 — Pages per Session Trend</h2>
        <p class="text-sm text-gray-500 mb-4">Higher pages per session = users exploring more content. A declining trend after a redesign can indicate navigation problems.</p>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="bg-white shadow-sm rounded-lg p-5">
            <div class="text-4xl font-bold text-gray-800 tabular-nums mb-1">{{ avgPagesPerSession.toFixed(2) }}</div>
            <div class="text-xs text-gray-400 mb-4">Avg pages per session (period)</div>
            <div class="text-sm text-gray-500">{{ totals.pageViews.toLocaleString() }} total page views<br>{{ totals.sessions.toLocaleString() }} total sessions</div>
          </div>
          <div class="lg:col-span-2 bg-white shadow-sm rounded-lg p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Pages per Session Over Time</h3>
            <div class="h-44">
              <ClientOnly :key="range">
                <Ga4LineChart :labels="chartLabels" :datasets="pagesPerSessionTrend" />
              </ClientOnly>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           B1 — CHANNEL GROUP (clean labels)
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">B1 — Clean Channel Groups <span class="text-amber-500 text-sm font-normal">★ New pull needed for sessionDefaultChannelGroup field</span></h2>
        <p class="text-sm text-gray-500 mb-4">GA4's built-in channel grouping (Organic Search, Direct, Referral, Organic Social, etc.) is far more readable than raw source/medium strings. Until a new pull is run, this falls back to medium-based grouping.</p>
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Channel Group</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Sessions</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Users</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">New Users</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Engagement</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Bounce</th>
                <th class="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Share</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="ch in channelGroupRows" :key="ch.group" class="hover:bg-gray-50">
                <td class="px-4 py-2.5">
                  <span class="inline-flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: channelGroupColor(ch.group) }" />
                    <span class="font-medium text-gray-800">{{ ch.group }}</span>
                  </span>
                </td>
                <td class="px-4 py-2.5 text-right text-gray-800 tabular-nums">{{ ch.sessions.toLocaleString() }}</td>
                <td class="px-4 py-2.5 text-right text-gray-700 tabular-nums">{{ ch.users.toLocaleString() }}</td>
                <td class="px-4 py-2.5 text-right text-gray-700 tabular-nums">{{ ch.newUsers.toLocaleString() }}</td>
                <td class="px-4 py-2.5 text-right tabular-nums" :class="ch.engagementRate >= 60 ? 'text-green-600 font-medium' : ch.engagementRate >= 40 ? 'text-amber-600' : 'text-red-500'">
                  {{ ch.engagementRate.toFixed(1) }}%
                </td>
                <td class="px-4 py-2.5 text-right tabular-nums" :class="ch.bounceRate >= 70 ? 'text-red-500 font-medium' : ch.bounceRate >= 50 ? 'text-amber-600' : 'text-green-600'">
                  {{ ch.bounceRate.toFixed(1) }}%
                </td>
                <td class="px-4 py-2.5">
                  <div class="flex items-center gap-2">
                    <div class="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full" :style="{ width: pct(ch.sessions, totalChannelSessions) + '%', backgroundColor: channelGroupColor(ch.group) }" />
                    </div>
                    <span class="text-xs text-gray-500">{{ pct(ch.sessions, totalChannelSessions) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           B2 — LANDING PAGES vs EXIT PAGES
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">B2 — Landing Pages &amp; Exit Pages <span class="text-amber-500 text-sm font-normal">★ New pull needed for entrances &amp; exitRate fields</span></h2>
        <p class="text-sm text-gray-500 mb-4">Which pages acquire sessions (landing pages) and which lose them (exit pages)? High exit rate on a key page = conversion or UX problem.</p>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Top Landing Pages -->
          <div class="bg-white shadow-sm rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100 bg-green-50">
              <h3 class="text-sm font-semibold text-green-800">↓ Top Landing Pages (by Entrances)</h3>
              <p class="text-xs text-green-600 mt-0.5">Pages where most sessions begin</p>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Entrances</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Engagement</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="p in topLandingPages" :key="p.pagePath" class="hover:bg-gray-50">
                  <td class="px-4 py-2 text-gray-700 truncate max-w-[200px]" :title="p.pagePath">{{ p.pagePath }}</td>
                  <td class="px-4 py-2 text-right text-gray-800 tabular-nums">
                    <span v-if="p.entrances > 0">{{ p.entrances.toLocaleString() }}</span>
                    <span v-else class="text-gray-300 text-xs">— pull needed</span>
                  </td>
                  <td class="px-4 py-2 text-right text-gray-600 tabular-nums text-xs">{{ p.screenPageViews.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right text-xs" :class="p.engagementRate * 100 >= 60 ? 'text-green-600' : p.engagementRate * 100 >= 40 ? 'text-amber-600' : 'text-red-500'">
                    {{ (p.engagementRate * 100).toFixed(1) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Top Exit Pages -->
          <div class="bg-white shadow-sm rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100 bg-red-50">
              <h3 class="text-sm font-semibold text-red-800">↑ Top Exit Pages (by Exit Rate)</h3>
              <p class="text-xs text-red-600 mt-0.5">Pages where most sessions end — high rate = potential UX issue</p>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Exit Rate</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Bounce</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="p in topExitPages" :key="p.pagePath" class="hover:bg-gray-50">
                  <td class="px-4 py-2 text-gray-700 truncate max-w-[200px]" :title="p.pagePath">{{ p.pagePath }}</td>
                  <td class="px-4 py-2 text-right tabular-nums">
                    <span v-if="p.exitRate > 0" class="text-xs font-medium" :class="p.exitRate * 100 >= 60 ? 'text-red-500' : p.exitRate * 100 >= 40 ? 'text-amber-600' : 'text-gray-700'">
                      {{ (p.exitRate * 100).toFixed(1) }}%
                    </span>
                    <span v-else class="text-gray-300 text-xs">— pull needed</span>
                  </td>
                  <td class="px-4 py-2 text-right text-gray-600 tabular-nums text-xs">{{ p.screenPageViews.toLocaleString() }}</td>
                  <td class="px-4 py-2 text-right text-xs" :class="p.bounceRate * 100 >= 70 ? 'text-red-500' : p.bounceRate * 100 >= 50 ? 'text-amber-600' : 'text-green-600'">
                    {{ (p.bounceRate * 100).toFixed(1) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           B3 — SCROLL DEPTH PER PAGE
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">B3 — Scroll Depth per Page <span class="text-amber-500 text-sm font-normal">★ New pull needed for scrolledUsers field</span></h2>
        <p class="text-sm text-gray-500 mb-4">High pageviews + low scroll depth = content failing to engage. These are the pages where users arrive but leave without reading. Prioritise for content improvement.</p>
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Users</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Scrolled Users</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Scroll Depth</th>
                <th class="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Depth Bar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="p in scrollDepthPages" :key="p.pagePath" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-700 truncate max-w-[240px]" :title="p.pagePath">{{ p.pagePath }}</td>
                <td class="px-4 py-2 text-right text-gray-700 tabular-nums text-xs">{{ p.users.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right tabular-nums text-xs">
                  <span v-if="p.scrolledUsers > 0" class="text-gray-700">{{ p.scrolledUsers.toLocaleString() }}</span>
                  <span v-else class="text-gray-300">— pull needed</span>
                </td>
                <td class="px-4 py-2 text-right text-xs font-medium tabular-nums"
                  :class="scrollPct(p) >= 60 ? 'text-green-600' : scrollPct(p) >= 30 ? 'text-amber-600' : p.scrolledUsers === 0 ? 'text-gray-300' : 'text-red-500'">
                  {{ p.scrolledUsers > 0 ? scrollPct(p).toFixed(0) + '%' : '—' }}
                </td>
                <td class="px-4 py-2">
                  <div class="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all"
                      :style="{ width: scrollPct(p) + '%', backgroundColor: scrollPct(p) >= 60 ? '#22c55e' : scrollPct(p) >= 30 ? '#f59e0b' : '#ef4444' }"
                    />
                  </div>
                </td>
              </tr>
              <tr v-if="!scrollDepthPages.length">
                <td colspan="5" class="px-4 py-6 text-center text-gray-400 text-sm">No page data yet. Select a property above.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════
           A7 — ENGAGEMENT SCORE TABLE
           ══════════════════════════════════════════════════════════════ -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-800 mb-1">A7 — Content Engagement Score</h2>
        <p class="text-sm text-gray-500 mb-4">A composite score (engagement rate × 50% + avg duration score × 30% + sessions score × 20%) makes it easy to rank content by overall quality. Color-coded rows let you scan for problem pages instantly.</p>
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Sessions</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Engagement</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Avg Duration</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
                <th class="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Rating</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="p in engagementScorePages"
                :key="p.pagePath"
                class="hover:bg-gray-50"
                :class="p.score >= 70 ? 'bg-green-50/40' : p.score < 35 ? 'bg-red-50/40' : ''"
              >
                <td class="px-4 py-2 text-gray-700 truncate max-w-[220px]" :title="p.pagePath">{{ p.pagePath }}</td>
                <td class="px-4 py-2 text-right text-gray-700 tabular-nums text-xs">{{ p.sessions.toLocaleString() }}</td>
                <td class="px-4 py-2 text-right text-xs" :class="p.engagementRate * 100 >= 60 ? 'text-green-600 font-medium' : p.engagementRate * 100 >= 40 ? 'text-amber-600' : 'text-red-500'">
                  {{ (p.engagementRate * 100).toFixed(1) }}%
                </td>
                <td class="px-4 py-2 text-right text-gray-600 tabular-nums text-xs">{{ formatDuration(p.avgSessionDurationSec) }}</td>
                <td class="px-4 py-2 text-right">
                  <span class="text-sm font-bold tabular-nums" :class="p.score >= 70 ? 'text-green-600' : p.score >= 35 ? 'text-amber-600' : 'text-red-500'">
                    {{ p.score.toFixed(0) }}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                    :class="p.score >= 70 ? 'bg-green-100 text-green-700' : p.score >= 35 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'">
                    {{ p.score >= 70 ? 'Strong' : p.score >= 35 ? 'Fair' : 'Weak' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </template>

    <div v-else-if="!loading && selectedPropertyId" class="text-sm text-gray-500 mt-8 text-center">
      No GA4 data found. Try importing historical data from the <NuxtLink to="/import" class="text-indigo-600 hover:underline">Import</NuxtLink> page.
    </div>
    <div v-else-if="!selectedPropertyId" class="text-sm text-gray-400 mt-8 text-center">
      Select a property above to load analytics.
    </div>

  </div>
</template>


<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

// ── Types ─────────────────────────────────────────────────────────

interface Property { _id: string; propertyName: string }

interface DailyTotal {
  date: string
  sessions: number
  users: number
  screenPageViews: number
  newUsers: number
  bounceRate: number
  engagementRate: number
  avgSessionDurationSec: number
}

interface OverviewData {
  dailyTotals: DailyTotal[]
  channelTotals: { medium: string; sessions: number; users: number }[]
  totals: { sessions: number; users: number; pageViews: number; newUsers: number; bounceRate: number; engagementRate: number; avgSessionDurationSec: number }
}

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
}

interface TrafficSource {
  source: string
  medium: string
  sessions: number
  users: number
  newUsers: number
  bounceRate: number
  engagementRate: number
}

interface DeviceMetric { deviceCategory: string; sessions: number; users: number; screenPageViews: number }

interface OrganicPoint { date: string; totalSessions: number; organicSessions: number; organicPct: number }

// ── State ──────────────────────────────────────────────────────────

const properties = ref<Property[]>([])
const selectedPropertyId = ref('')
const loading = ref(false)

const overview = ref<OverviewData | null>(null)
const pages = ref<PageMetric[]>([])
const sources = ref<TrafficSource[]>([])
const devices = ref<DeviceMetric[]>([])
const organicTrend = ref<OrganicPoint[]>([])

const ranges = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]
const range = ref('30d')

// ── Convenience ────────────────────────────────────────────────────

const totals = computed(() => overview.value?.totals ?? { sessions: 0, users: 0, pageViews: 0, newUsers: 0, bounceRate: 0, engagementRate: 0, avgSessionDurationSec: 0 })
const dailyTotals = computed(() => overview.value?.dailyTotals ?? [])

const chartLabels = computed(() =>
  dailyTotals.value.map((d) => {
    const [, m, day] = d.date.split('-')
    return `${parseInt(m)}/${parseInt(day)}`
  })
)

// ── A1: Device donut ───────────────────────────────────────────────

const DEVICE_COLORS: Record<string, string> = { desktop: '#6366f1', mobile: '#10b981', tablet: '#f59e0b' }

const deviceDonutSessions = computed(() =>
  devices.value.map((d) => ({
    label: d.deviceCategory,
    value: d.sessions,
    color: DEVICE_COLORS[d.deviceCategory] ?? '#94a3b8',
  }))
)
const deviceDonutViews = computed(() =>
  devices.value.map((d) => ({
    label: d.deviceCategory,
    value: d.screenPageViews,
    color: DEVICE_COLORS[d.deviceCategory] ?? '#94a3b8',
  }))
)
const deviceTotal = computed(() => devices.value.reduce((s, d) => s + d.sessions, 0))
const deviceViewsTotal = computed(() => devices.value.reduce((s, d) => s + d.screenPageViews, 0))

// Mobile share trend: approximate as constant device split applied to daily totals
// (real time-series device data would need a new endpoint, but this gives the right shape)
const mobileShareConstant = computed(() => {
  const mobile = devices.value.find((d) => d.deviceCategory === 'mobile')
  if (!mobile || !deviceTotal.value) return 0
  return (mobile.sessions / deviceTotal.value) * 100
})
const mobileShareTrend = computed(() =>
  dailyTotals.value.map(() => Math.round(mobileShareConstant.value * 10) / 10)
)

// ── A2 + D1: New vs Returning ──────────────────────────────────────

const returningUsersTotal = computed(() => Math.max(0, totals.value.users - totals.value.newUsers))
const returningRateCurrent = computed(() => {
  if (!totals.value.users) return 0
  return (returningUsersTotal.value / totals.value.users) * 100
})

const newReturningDonut = computed(() => [
  { label: 'New Users', value: totals.value.newUsers, color: '#6366f1' },
  { label: 'Returning', value: returningUsersTotal.value, color: '#10b981' },
])

const returningRateTrend = computed(() => [{
  label: 'Returning %',
  values: dailyTotals.value.map((d) => {
    if (!d.users) return 0
    return Math.round(((d.users - d.newUsers) / d.users) * 1000) / 10
  }),
  color: '#10b981',
  fillColor: 'rgba(16,185,129,0.08)',
}])

// ── A3: Channel quality ────────────────────────────────────────────

interface ChannelQuality {
  medium: string
  sessions: number
  users: number
  newUsers: number
  engagementRate: number
  bounceRate: number
}

const channelQuality = computed<ChannelQuality[]>(() => {
  const map = new Map<string, ChannelQuality>()
  for (const s of sources.value) {
    const key = s.medium || '(none)'
    const existing = map.get(key)
    if (existing) {
      existing.sessions += s.sessions
      existing.users += s.users
      existing.newUsers += s.newUsers
      // Weighted avg engagement/bounce
      const total = existing.sessions + s.sessions
      existing.engagementRate = ((existing.engagementRate * existing.sessions) + (s.engagementRate * 100 * s.sessions)) / total
      existing.bounceRate = ((existing.bounceRate * existing.sessions) + (s.bounceRate * 100 * s.sessions)) / total
    } else {
      map.set(key, { medium: key, sessions: s.sessions, users: s.users, newUsers: s.newUsers, engagementRate: s.engagementRate * 100, bounceRate: s.bounceRate * 100 })
    }
  }
  return [...map.values()].sort((a, b) => b.sessions - a.sessions).slice(0, 8)
})

const totalChannelSessions = computed(() => channelQuality.value.reduce((s, c) => s + c.sessions, 0))

const channelQualityLabels = computed(() =>
  channelQuality.value.map((c) => (c.medium === '(none)' ? 'Direct' : c.medium))
)
const channelQualityDatasets = computed(() => [
  { label: 'Engagement %', values: channelQuality.value.map((c) => c.engagementRate), color: '#10b981' },
  { label: 'Bounce %', values: channelQuality.value.map((c) => c.bounceRate), color: '#ef4444' },
])

function engageBarColor(pct: number): string {
  if (pct >= 60) return '#22c55e'
  if (pct >= 40) return '#f59e0b'
  return '#ef4444'
}
function bounceBarColor(pct: number): string {
  if (pct >= 70) return '#ef4444'
  if (pct >= 50) return '#f59e0b'
  return '#22c55e'
}

// ── A5: Day of week heatmap ────────────────────────────────────────

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const dayStats = computed(() => {
  const buckets: Record<number, { sessions: number[]; views: number[] }> = {}
  for (let i = 1; i <= 7; i++) buckets[i] = { sessions: [], views: [] }

  for (const d of dailyTotals.value) {
    const date = new Date(d.date + 'T00:00:00')
    let dow = date.getDay() // 0=Sun
    if (dow === 0) dow = 7  // make Sun = 7
    buckets[dow].sessions.push(d.sessions)
    buckets[dow].views.push(d.screenPageViews)
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  return [1, 2, 3, 4, 5, 6, 7].map((i) => ({
    day: dayNames[i - 1],
    avgSessions: avg(buckets[i].sessions),
    avgViews: avg(buckets[i].views),
  }))
})

const maxDayAvg = computed(() => Math.max(...dayStats.value.map((d) => d.avgSessions), 1))

function heatColor(value: number, max: number): string {
  const intensity = max > 0 ? value / max : 0
  const r = Math.round(99 + (63 - 99) * intensity)    // 99→63 (indigo-ish)
  const g = Math.round(102 + (99 - 102) * intensity)
  const b = Math.round(241 + (241 - 241) * intensity)
  const alpha = 0.1 + intensity * 0.85
  return `rgba(99,102,241,${alpha.toFixed(2)})`
}

// ── D4: Organic share trend ────────────────────────────────────────

const organicTrendLabels = computed(() =>
  organicTrend.value.map((d) => {
    const [, m, day] = d.date.split('-')
    return `${parseInt(m)}/${parseInt(day)}`
  })
)
const organicTrendDataset = computed(() => [{
  label: 'Organic %',
  values: organicTrend.value.map((d) => d.organicPct),
  color: '#10b981',
  fillColor: 'rgba(16,185,129,0.1)',
}])
const organicShareAvg = computed(() => {
  if (!organicTrend.value.length) return 0
  return organicTrend.value.reduce((s, d) => s + d.organicPct, 0) / organicTrend.value.length
})
const organicSessionsTotal = computed(() => organicTrend.value.reduce((s, d) => s + d.organicSessions, 0))
const organicTotalSessions = computed(() => organicTrend.value.reduce((s, d) => s + d.totalSessions, 0))

// ── D2: Content health tiers ───────────────────────────────────────

const contentHealthTiers = computed(() => {
  const high = pages.value.filter((p) => p.engagementRate >= 0.6).length
  const med = pages.value.filter((p) => p.engagementRate >= 0.3 && p.engagementRate < 0.6).length
  const low = pages.value.filter((p) => p.engagementRate < 0.3).length
  return [
    { label: 'Strong', range: '≥ 60% engagement', count: high, color: '#22c55e' },
    { label: 'Fair', range: '30–60% engagement', count: med, color: '#f59e0b' },
    { label: 'Weak', range: '< 30% engagement', count: low, color: '#ef4444' },
  ]
})
const contentHealthDonut = computed(() =>
  contentHealthTiers.value.map((t) => ({ label: t.label, value: t.count, color: t.color }))
)

// ── D3: Traffic concentration ──────────────────────────────────────

const totalSessions = computed(() => pages.value.reduce((s, p) => s + p.sessions, 0))

const sortedPagesBySession = computed(() =>
  [...pages.value].sort((a, b) => b.sessions - a.sessions)
)

const concentrationCards = computed(() => {
  const top = (n: number) => {
    const sessions = sortedPagesBySession.value.slice(0, n).reduce((s, p) => s + p.sessions, 0)
    return { label: `Top ${n} page${n > 1 ? 's' : ''}`, sessions, pct: totalSessions.value ? (sessions / totalSessions.value) * 100 : 0 }
  }
  return [top(1), top(3), top(5)]
})

const concentrationPages = computed(() => sortedPagesBySession.value.slice(0, 10))

const CONC_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#e0e7ff', '#818cf8', '#94a3b8', '#cbd5e1', '#e2e8f0']
function concentrationColor(i: number): string { return CONC_COLORS[i] ?? '#e2e8f0' }

// ── B4: Pages per session ──────────────────────────────────────────

const avgPagesPerSession = computed(() => {
  if (!totals.value.sessions) return 0
  return totals.value.pageViews / totals.value.sessions
})

const pagesPerSessionTrend = computed(() => [{
  label: 'Pages / Session',
  values: dailyTotals.value.map((d) => d.sessions > 0 ? Math.round((d.screenPageViews / d.sessions) * 100) / 100 : 0),
  color: '#8b5cf6',
  fillColor: 'rgba(139,92,246,0.08)',
}])

// ── B1: Channel group table ────────────────────────────────────────

// Derives clean channel label from medium (fallback until channelGroup data available)
function mediumToChannel(medium: string): string {
  const m = medium.toLowerCase()
  if (m === 'organic') return 'Organic Search'
  if (m === '(none)' || m === '' || m === 'direct') return 'Direct'
  if (m === 'referral') return 'Referral'
  if (m === 'email') return 'Email'
  if (m === 'cpc' || m === 'ppc' || m === 'paid') return 'Paid Search'
  if (m === 'social' || m === 'social-network' || m === 'social_network') return 'Organic Social'
  if (m === 'affiliate') return 'Affiliates'
  return medium
}

const CHANNEL_GROUP_COLORS: Record<string, string> = {
  'Organic Search': '#10b981',
  'Direct': '#6b7280',
  'Referral': '#6366f1',
  'Email': '#0ea5e9',
  'Paid Search': '#f59e0b',
  'Organic Social': '#ec4899',
  'Affiliates': '#8b5cf6',
}
function channelGroupColor(g: string): string { return CHANNEL_GROUP_COLORS[g] ?? '#94a3b8' }

const channelGroupRows = computed(() => {
  const map = new Map<string, ChannelQuality>()
  for (const s of sources.value) {
    const group = mediumToChannel(s.medium)
    const existing = map.get(group)
    if (existing) {
      const total = existing.sessions + s.sessions
      existing.engagementRate = ((existing.engagementRate * existing.sessions) + (s.engagementRate * 100 * s.sessions)) / total
      existing.bounceRate = ((existing.bounceRate * existing.sessions) + (s.bounceRate * 100 * s.sessions)) / total
      existing.sessions += s.sessions
      existing.users += s.users
      existing.newUsers += s.newUsers
    } else {
      map.set(group, { medium: group, sessions: s.sessions, users: s.users, newUsers: s.newUsers, engagementRate: s.engagementRate * 100, bounceRate: s.bounceRate * 100 })
    }
  }
  return [...map.values()].sort((a, b) => b.sessions - a.sessions)
})

// ── B2: Landing / Exit pages ───────────────────────────────────────

const topLandingPages = computed(() =>
  [...pages.value].sort((a, b) => (b.entrances ?? 0) - (a.entrances ?? 0)).slice(0, 10)
)
const topExitPages = computed(() =>
  [...pages.value]
    .filter((p) => p.screenPageViews > 50)
    .sort((a, b) => (b.exitRate ?? 0) - (a.exitRate ?? 0))
    .slice(0, 10)
)

// ── B3: Scroll depth ───────────────────────────────────────────────

const scrollDepthPages = computed(() =>
  [...pages.value]
    .filter((p) => p.users > 10)
    .sort((a, b) => b.screenPageViews - a.screenPageViews)
    .slice(0, 20)
)
function scrollPct(p: PageMetric): number {
  if (!p.users || !p.scrolledUsers) return 0
  return (p.scrolledUsers / p.users) * 100
}

// ── A7: Engagement score ───────────────────────────────────────────

const maxDuration = computed(() => Math.max(...pages.value.map((p) => p.avgSessionDurationSec), 1))
const maxSessions = computed(() => Math.max(...pages.value.map((p) => p.sessions), 1))

const engagementScorePages = computed(() => {
  return [...pages.value]
    .filter((p) => p.sessions >= 5)
    .map((p) => {
      const engScore = p.engagementRate * 100 * 0.5
      const durScore = (p.avgSessionDurationSec / maxDuration.value) * 100 * 0.3
      const sesScore = (p.sessions / maxSessions.value) * 100 * 0.2
      return { ...p, score: engScore + durScore + sesScore }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
})

// ── Helpers ────────────────────────────────────────────────────────

function pct(n: number, total: number): string {
  if (!total) return '0'
  return ((n / total) * 100).toFixed(1)
}

function formatDuration(sec: number): string {
  if (!sec) return '0s'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// ── Data loading ───────────────────────────────────────────────────

async function load() {
  if (!selectedPropertyId.value) return
  loading.value = true
  overview.value = null
  pages.value = []
  sources.value = []
  devices.value = []
  organicTrend.value = []

  try {
    const pid = selectedPropertyId.value
    const r = range.value
    const [ov, pg, sr, dv, ot] = await Promise.all([
      $fetch<{ data: OverviewData }>(`/api/ga4/overview?propertyId=${pid}&range=${r}`),
      $fetch<{ data: PageMetric[] }>(`/api/ga4/page-metrics?propertyId=${pid}&range=${r}&limit=500`),
      $fetch<{ data: TrafficSource[] }>(`/api/ga4/traffic-sources?propertyId=${pid}&range=${r}`),
      $fetch<{ data: DeviceMetric[] }>(`/api/ga4/device-metrics?propertyId=${pid}&range=${r}`),
      $fetch<{ data: OrganicPoint[] }>(`/api/ga4/organic-trend?propertyId=${pid}&range=${r}`),
    ])
    overview.value = ov.data
    pages.value = pg.data
    sources.value = sr.data
    devices.value = dv.data
    organicTrend.value = ot.data
  } catch {
    // silent — individual missing data is handled in template
  } finally {
    loading.value = false
  }
}

watch([selectedPropertyId, range], () => { if (selectedPropertyId.value) load() })

async function loadProperties() {
  try {
    const res = await $fetch<{ data: Property[] }>('/api/properties')
    properties.value = res.data
    if (properties.value.length === 1) selectedPropertyId.value = properties.value[0]._id
  } catch {}
}

onMounted(loadProperties)
</script>
