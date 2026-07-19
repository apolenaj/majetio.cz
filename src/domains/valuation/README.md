# Domain: valuation

Production valuation engine (Prompt 10).

## Structure

- `types.ts` / `index.ts` — schema-aligned enums & `ValuationInputSnapshot` (Part 1)
- `schemas/` — Zod (upcoming)
- `service/` — pure calculation + comparable selection (Part 2+)
- `server/` — persistence / actions
- `tests/`

## Persistence (Prisma)

| Model | Role |
| --- | --- |
| `Valuation` | Result + frozen `inputSnapshot` |
| `ValuationComparable` | Comps with weights / inclusion |
| `ValuationAdjustmentAudit` | Analyst manual change history |
| `ValuationModelRegistry` | Algorithm version catalog |

Do not put financial calculations in React components.
