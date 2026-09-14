# Data Quality Pipeline

Centralized quality control for listings and location metrics — one `DataQualityIssue` table (property **or** location scoped).

## Categories

| Category | Typical rules |
|----------|----------------|
| `MISSING` | Required title / city / price absent |
| `CONFLICT` | Area mismatch, contradictory fields |
| `ANOMALY` | Extreme Kč/m², price vs median deviation |
| `STALE` | Source / metric silence |
| `DUPLICATE` | High similarity candidate pairs |

Mapping: `categoryForRuleCode` in `src/domains/data-quality/admin/taxonomy.ts`.

## Workflow statuses

| Ops workflow | Legacy aliases |
|--------------|----------------|
| `OPEN` | — |
| `IN_REVIEW` | `ACKNOWLEDGED` |
| `RESOLVED` | — (requires reason + actor) |
| `FALSE_POSITIVE` | `IGNORED` (ML / rule tuning) |

Open attention = `OPEN` + `IN_REVIEW` + `ACKNOWLEDGED`.

## Explainability & rule versioning

Every issue should answer **why**, not only “Suspicious”:

- `ruleCode` + `ruleVersion` (default `"1"`)  
- `explanation` — e.g. *„Cena je o 83 % nižší než medián lokality (4 200 000).“*  
- Helpers: `explainDataQualityIssue`, `detectPriceVsMedianIssue`  

Detectors (pure): `detectDataQualityIssues` in `src/domains/properties/service/data-quality.ts`.

## Admin

- **DQ Center:** `/admin/data-quality`  
- Resolve / false-positive: permission `dataQuality.resolve`  
- Completeness score: `DataCompletenessScore` (separate metric, not an issue)  

## Relation to freshness

Listing silence → `Property.freshness` (`FRESH` / `STALE` / `UNAVAILABLE`) via `evaluatePropertyFreshness` (14d / 30d defaults).  
Ops impact view: `/admin/freshness` (e.g. „4 820 properties affected“).

See also: `docs/IMPORT_PIPELINE.md`.
