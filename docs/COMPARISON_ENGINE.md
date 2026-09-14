# Comparison Engine

Součást Property Decision Workspace. Logické jádro: `ComparisonDecisionPack`.

## Modely

| Model | Fields |
|-------|--------|
| `Comparison` | id, userId, name, manualOrder, version, createdAt, updatedAt |
| `ComparisonProperty` | comparisonId, propertyId, sortOrder, addedAt |
| `ComparisonSnapshot` | comparisonId, **publicMetrics** (JSON at T), fingerprints, isCurrent, createdAt |

**Limit:** `comparisonConfig.maxProperties = 4`.

**BOD 146:** Snapshot a public cache **nikdy** neobsahují personal financing / Finanční pas.

## Decision Pack (API)

```ts
buildComparisonDecisionPack({ comparisonId, propertyIds, userId, passport })
refreshComparisonDecisionPack({ ... }) // explicit „Aktualizovat porovnání“
getComparisonDecisionPackAction({ comparisonId, refresh? })
```

Payload per property:

- Scores: Majetio / Match / Location — vždy `confidence` + `breakdown` (missing → null, ne 0)
- Negotiation: asking, modeled max offer, gap, DOM, recent price drop
- Renovation: low/base/high, duration, ARV, value creation
- Financing: equity, loan, payment, gap — **vždy live**, never cached
- Risks: counts critical/high/medium/low + detaily
- `nextAction`, `completeness` (`low` \| `medium` \| `ready_for_decision`), advice „K rozhodnutí vám chybí…“

## Stale data (BOD 75, 104–106)

Fingerprint diff vs snapshot → např. „Cena se změnila od vašeho posledního porovnání“.  
Canonical snapshot se **nepřepisuje**, dokud uživatel neklikne Aktualizovat.

## N+1 / cache (BOD 144–146)

`loadComparisonModuleBundle` — paralelní batch queries (property, valuation, renovation, investment, analysis, price history).  
Public metrics TTL cache; personal overlays mimo cache.

## Routes / ViewModel (tabulka)

Stávající `ComparisonViewModel` + modes zůstávají pro UI tabulku. Decision Pack je strukturovaný zdroj pro insights / readiness.

## Code map

- `src/domains/comparisons/decision/` — engine
- `src/config/comparison.ts` — limity + cache TTL
- Migrace: `prisma/migrations/20260720270000_comparison_snapshot/`
