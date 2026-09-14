# Location pages — frontend, SEO, maps

## URL structure

Canonical nested paths:

- `/lokality/praha`
- `/lokality/praha/vinohrady`
- `/lokality/brno`
- `/lokality/liberec` (thin demo)

Flat aliases (e.g. `/lokality/praha-vinohrady`) **308 redirect** to canonical.

Reserved siblings: `/lokality/porovnani`, `/lokality/prilezitosti/[slug]`.

## SEO & thin pages

- **Synthetic demos are always `noindex`** (`isDemo === true`).
- Non-demo: index only when `isLocationPageIndexable` — ≥3 metrics with sampleCount ≥ 20 and avg confidence ≥ 0.5.
- JSON-LD: `BreadcrumbList` + `Place` only — **no AggregateRating**.
- Sitemap lists `/lokality` hub + porovnání — **not** individual demo city URLs.

## Dynamic market summary

`buildDynamicMarketSummary` — Czech sentences from metric values only.

## Analytics

`location_page_view`, `location_metric_viewed`, `location_chart_viewed`, `location_map_*`, `location_comparison_viewed`, `location_internal_link_clicked`.

## Comparison UI

Desktop table / mobile stacked cards; Finanční pas match highlight.

## Map layers

price / rent / yield / supply — geohash, min 5 samples/cell, lazy SVG, always with table (A11y). Demo maps labeled as synthetic.
