# Domain: properties

Modular domain boundary for Majetio.

Expected structure (grow as features land):

- `schemas/` — Zod validation
- `service/` — business logic (pure where possible)
  - `dedupe-score.ts` — similarity scoring for duplicate candidates
  - `merge-strategy.ts` — non-destructive merge + conflict resolution
  - `data-quality.ts` — anomaly rules
  - `completeness.ts` — fill-quality metric
  - `field-overrides.ts` — analyst locks vs feed imports
- `server/` — Server Actions / data access
- `components/` — domain UI
- `tests/` — unit tests (co-located `*.test.ts` under `service/` for Part 3)

Do not put financial calculations in React components.
