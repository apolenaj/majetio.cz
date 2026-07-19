# Domain: valuation

Production valuation engine (Prompt 10).

## Structure

- `types.ts` — Prisma-aligned enums & `ValuationInputSnapshot` (Part 1)
- `service/` — pure math core (Part 2)
  - `geo-hierarchy.ts` — MICRO → NEIGHBOR → BROADER
  - `time-decay.ts` — exponential half-life decay
  - `similarity.ts` — area / layout / condition
  - `comparable-selection.ts` — selection + weighting
  - `outliers.ts` — IQR + z-score (mark `excluded`, never delete)
  - `base-valuation.ts` — weighted median/mean Kč/m²
  - `adjustments.ts` — feature korekce (`factor`, `amountCzk`, `reason`)
  - `index.ts` — `runValuationCore` pipeline
- `schemas/` / `server/` — upcoming parts

## Persistence (Prisma)

| Model | Role |
| --- | --- |
| `Valuation` | Result + frozen `inputSnapshot` |
| `ValuationComparable` | Comps with weights / inclusion |
| `ValuationAdjustmentAudit` | Analyst manual change history |
| `ValuationModelRegistry` | Algorithm version catalog |

## Engine version

`VALUATION_CORE_ENGINE_VERSION` = `residential_apartment_v1.core.0.1.0`

Do not put financial calculations in React components. Confidence / range = Part 3.
