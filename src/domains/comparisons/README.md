# Domain: comparisons — Comparison Engine

## Models

- `Comparison` — id, userId, name, version, manualOrder
- `ComparisonProperty` — sortOrder (`order`), addedAt
- `ComparisonSnapshot` — public metrics at time T + fingerprints (no personal financing)

Limit: `comparisonConfig.maxProperties` (**4**).

## Decision Pack

`buildComparisonDecisionPack` / `getComparisonDecisionPackAction` — structured UI payload:

scores + confidence · negotiation gap · renovation bands · private financing · risks by severity · nextAction · completeness · „K rozhodnutí vám chybí…“

Stale diffs without auto-overwrite; refresh creates a new snapshot.

## ViewModel (table UI)

`ComparisonViewModel` — `buildComparisonViewModel` for `/porovnani` modes & highlights.

## Rules

- Missing → null / „Není k dispozici“, never fake `0 %`
- Public cache only; Finanční pas overlays always live
- Advice never says „Kupte tuto“
