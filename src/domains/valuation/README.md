# Domain: valuation

Production valuation engine (Prompt 10).

## Structure

- `types.ts` — Prisma-aligned enums & `ValuationInputSnapshot` (Part 1)
- `service/` — pure math core
  - Part 2: geo, time-decay, similarity, selection, outliers, base, adjustments
  - Part 3: `range.ts`, `confidence.ts`, `edge-cases.ts`, `staleness.ts`
  - `runValuationEstimate` — full automated estimate with bounds + confidence
- `schemas/` / `server/` — upcoming parts

## Persistence (Prisma)

| Model | Role |
| --- | --- |
| `Valuation` | Result + frozen `inputSnapshot` |
| `ValuationComparable` | Comps with weights / inclusion |
| `ValuationAdjustmentAudit` | Analyst manual change history |
| `ValuationModelRegistry` | Algorithm version catalog |

## Engine version

`VALUATION_CORE_ENGINE_VERSION` = `residential_apartment_v1.core.0.2.0`

## Recalculation policy

`shouldRecalculateValuation` — refresh only on: missing cache, manual request, asking-price change (≥3 %), subject fingerprint change, model version change, age ≥ 14 days, or OUTDATED/FAILED status. **Not** on every page view.

Do not put financial calculations in React components.
