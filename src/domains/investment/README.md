# Domain: investment

Investment Calculation Engine for Majetio (builds on Prompts 1–10 + finance primitives).

## Layout

```
src/domains/investment/
  engine/          ← pure calculation engine (no React / no Prisma I/O)
    calculations/  ← annuity, NOI, amortization, projection, IRR…
    scenarios/     ← LTR, cash, STR, flip, renovation+rent
    risk/          ← sensitivity, stress, break-even, flags, confidence
    formulas/      ← formula registry (explainability)
    schemas/       ← Zod Input / Result
    __fixtures__/  ← golden cases (Part 2/D)
    __tests__/     ← golden / NFR / property tests
  service/         ← orchestration (snapshot, assumptions, hash/cache, Prisma)
  hooks/           ← useInvestmentCalculation (ephemeral UI + Save)
  server/          ← Server Actions (save scenario)
  observability/   ← calculation telemetry (latency, missing-input rate)
```

Legacy lightweight helpers remain in `src/domains/investment-calculations/` until migrated.

## Rules

- No floating-point money math — use `decimal.js` via `@/domains/finance`.
- Percentages stored as **ratios** (5.4 % → `0.054`).
- **Nominal interest** drives annuity; **APR/RPSN** is disclosure only.
- **Net Yield** denominator is always **Total Acquisition Cost**.
- SVJ advances are tracked but excluded from NOI opex.
- UI must import results/DTOs only — never embed formulas in components.
- Persisted analyses freeze `calculationEngineVersion` + `formulaRegistryVersion`;
  formula changes must not rewrite historical DB rows in place.
- Missing inputs → `unavailableMetrics` + warnings — never fake `0`.
- Sensitivity / pure engine runs in-memory — no N+1 DB queries.
- User-specific scenarios / `/ucet` / `/analyza/` → `noindex`.
- Analytics events never carry CZK amounts or PII.

## Documentation

- Interní: `docs/INVESTMENT_ENGINE.md` a související `INVESTMENT_*.md`
- DoD report: `docs/INVESTMENT_ENGINE_PART2E_REPORT.md`
- Veřejná metodika: `/jak-pocitame-vynos` (`src/content/yield-methodology.ts`)
