# GA4 Tracking Fixes — Session 2026-04-10

## 1. Top Landing Pages Showing "No entrance data — pull needed"

**Root cause:** `entrances` and `exitRate` were defined in `Ga4PageMetric.js` and queried by `/api/ga4/page-metrics`, but were never included in the GA4 Data API request in `server/utils/ga4.ts`. They were always stored as `0`, so `landingPages` (filtered by `p.entrances > 0`) returned empty.

**Fix:** Added `entrances` and `exitRate` to the page metrics request in `pullGa4Data()`:

```ts
// server/utils/ga4.ts — page metrics request
{ name: 'entrances' },   // m[9]
{ name: 'exitRate' },    // m[10]
```

And mapped them in the upsert:
```ts
entrances: parseInt(m[9]?.value || '0'),
exitRate: parseFloat(m[10]?.value || '0'),
```

**Backfill note:** Existing historical records in MongoDB will remain `0` for these fields. Only future pulls will populate them. To backfill, re-pull each past date via `/api/pull/ga4` with a `date` body parameter.

---

## 2. Revenue & E-commerce Section Always Showing Placeholder

**Root cause:** The Revenue & E-commerce section in `/ga4/conversions` was a hardcoded static placeholder — no dynamic data, no fetch, no models. It always showed "E-commerce tracking not detected" for everyone regardless of GA4 setup.

**Fix — new files created:**

- `server/models/Ga4EcommerceSummary.js` — daily totals: `totalRevenue`, `purchases`, `itemsPurchased`, `addToCarts`
- `server/models/Ga4EcommerceItem.js` — per-item daily data: `itemId`, `itemName`, `itemCategory`, `itemRevenue`, `itemsPurchased`, `itemsAddedToCart`, `itemsViewed`
- `server/api/ga4/ecommerce.get.ts` — aggregates both collections over selected date range, returns `summary` + `items`

**Fix — updated files:**

- `server/utils/ga4.ts` — two new GA4 Data API calls appended to every `pullGa4Data()` run:
  1. Daily e-commerce summary (no dimension, single row of totals)
  2. Per-item breakdown (dimensions: `itemId`, `itemName`, `itemCategory`)
- `app/pages/ga4/conversions.vue` — Revenue & E-commerce section now:
  - Fetches from `/api/ga4/ecommerce` alongside existing page-metrics and traffic-sources calls
  - Shows live KPIs (Total Revenue, Transactions, AOV, Purchase Rate) when `hasRevenue` is true
  - Shows cart → order funnel (Add to Carts → Purchases → Cart-to-Order Rate)
  - Shows top products table with Revenue, Purchased, Add to Cart, Viewed columns
  - Items with no `view_item` data show `—` instead of `0` (visually distinguishes missing data from genuine zero)
  - Falls back to placeholder only when no revenue/purchase data exists

---

## 3. GA4 E-commerce Data Quality Issues (Site-Side, Not Ranker)

Observed in GA4 → Reports → Monetization → E-commerce purchases:

### Items Viewed = 0
The `view_item` event is not firing. The product page HTML has no `dataLayer.push()` — GTM has no structured product data to work with, so the event never fires.

### Item Revenue Missing for Some Products
Price is embedded in unstructured DOM text:
```html
<div class="style1" id="priceBox">Sale Price: $17.90 </div>
```
GTM must regex-scrape this string to extract the price. It fails on products with different price formats (sale vs. regular, price ranges, etc.), resulting in `price: 0` in the items array and therefore `$0` item revenue.

### Fix Required on the Site (Miva Merchant templates)
Add a `dataLayer.push()` to every product page template before the GTM script, using Miva template variables to output the values dynamically:

```html
<script>
  window.dataLayer = window.dataLayer || [];
  dataLayer.push({
    event: 'view_item',
    ecommerce: {
      currency: 'USD',
      value: 17.90,            // Miva: [g.Product_Price]
      items: [{
        item_id: 'tshirt-girls-birthday-girl-skull',  // Miva: [g.Product_Code]
        item_name: 'Birthday Girl Skull T-shirt',     // Miva: [g.Product_Name]
        item_category: 'Girls Birthday',              // Miva: [g.Category_Name]
        price: 17.90,          // Miva: [g.Product_Price]
        quantity: 1
      }]
    }
  });
</script>
```

This push:
1. Fires `view_item` immediately on page load (fixes Items Viewed)
2. Makes structured item data available to GTM for the `add_to_cart` event on form submission (fixes price on add_to_cart)

### Other Issues Noted on the Product Page
- jQuery loaded twice (`jquery.min.js` + `jquery-1.3.2.min.js`) — can suppress GTM event listeners
- AddThis config references `UA-362055-1` (dead Universal Analytics ID) — harmless but can be removed
- Add to cart uses `<input type="image">` form submit — GTM needs a Form Submission trigger (not click trigger) to capture it reliably

---

## Summary of Files Changed

| File | Change |
|------|--------|
| `server/utils/ga4.ts` | Added `entrances` + `exitRate` to page metrics pull; added e-commerce summary + per-item pull |
| `server/models/Ga4EcommerceSummary.js` | **New** — daily e-commerce totals model |
| `server/models/Ga4EcommerceItem.js` | **New** — per-item daily e-commerce model |
| `server/api/ga4/ecommerce.get.ts` | **New** — e-commerce API endpoint |
| `app/pages/ga4/conversions.vue` | Wired Revenue & E-commerce section to live data |
