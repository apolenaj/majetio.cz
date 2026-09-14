# Location Intelligence — Anti-patterns (BOD 183 / DoD)

## Checklist

| Anti-pattern | Status | Enforcement |
|--------------|--------|-------------|
| Fake local stats as production | **PASS** (fixed) | `isDemo` stays true until real `LocationMetric` replace; demos labeled in UI |
| `0` instead of missing | **PASS** (fixed) | Aggregation `value: null` when no primary; scores use `null` |
| Programmatic SEO spam | **PASS** | Demo pages `noindex`; removed from sitemap; thin-page gate |
| Live aggregation on page load | **PASS** | Services read precomputed metrics/snapshots only |
| Discriminatory data | **PASS** | Scoring guardrails + tests |

## Rules (must hold)

1. Synthetic demos (`LOCATION_DEMO_PROFILES`) must set `isDemo: true` and never be indexed as live market pages.
2. Missing metric / score → `null` or suppress — never invent a convincing `0`.
3. No `AggregateRating` / fake reviews in JSON-LD.
4. No mass generation of empty municipality SEO pages.
5. API/page path must not `GROUP BY` millions of properties for aggregates.
6. No ethnicity / demographic / safety-score-of-people inputs.

## Map layers

Demo geohash cells must be labeled as demonstrační / synthetic (`isDemo` on `LocationMapSection`).

## Audit date

2026-07-20 — violations from interim audit remediated in DoD pass.
