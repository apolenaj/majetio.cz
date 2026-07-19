# Domain: valuation

Production valuation engine (Prompt 10).

## Structure

- `types.ts` — Prisma-aligned enums & `ValuationInputSnapshot` (Part 1)
- `dto.ts` — `PublicValuationDto` / `AnalystValuationDto` (Part 4)
- `service/` — pure math core + API service
  - Part 2: geo, time-decay, similarity, selection, outliers, base, adjustments
  - Part 3: `range.ts`, `confidence.ts`, `edge-cases.ts`, `staleness.ts`
  - Part 4: `valuation-service.ts` — DTO projection + licence anonymization
  - `runValuationEstimate` — full automated estimate with bounds + confidence
- Demo comps: `src/content/demo-valuation-comparables.ts`

## Persistence (Prisma)

| Model | Role |
| --- | --- |
| `Valuation` | Result + frozen `inputSnapshot` |
| `ValuationComparable` | Comps with weights / inclusion |
| `ValuationAdjustmentAudit` | Analyst manual change history |
| `ValuationModelRegistry` | Algorithm version catalog |

## Engine version

`VALUATION_CORE_ENGINE_VERSION` = `residential_apartment_v1.core.0.2.0`

## Security (Part 4)

- **Public DTO:** mid / range / confidence level + Czech explanations / public adjustments / 3–10 comps (anonymized when `publicLicense === ANONYMIZE`)
- **Analyst DTO:** + confidence score, base ppsqm, weights, geo tiers, full comparable set, input snapshot
- Legal disclaimer always on public UI: „Odhad Majetio je orientační…“

## Recalculation policy

`shouldRecalculateValuation` — refresh only on: missing cache, manual request, asking-price change (≥3 %), subject fingerprint change, model version change, age ≥ 14 days, or OUTDATED/FAILED status. **Not** on every page view.

Do not put financial calculations in React components.
