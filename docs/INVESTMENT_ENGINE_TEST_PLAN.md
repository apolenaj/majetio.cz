# Investment Engine — Test Plan

## Cíle

Ověřit finanční správnost, edge cases, NFR (precision, auth, performance), absenci falešných nul a regressi při změně verzí.

## Vrstvy

| Vrstva | Co | Kde |
|--------|----|-----|
| Unit / golden | Metriky vs Excel/hand fixtures | `engine/__tests__/golden.test.ts`, `calculations/*` |
| Edge / validation | null vs 0, LTV, vacancy, IRR | `engine/validation/edge-cases.test.ts` |
| Risk | Sensitivity monotónnost, stress, break-even | `engine/risk/risk.test.ts`, `__tests__/scenario-sensitivity-nfr.test.ts` |
| Property-based | Amortizace ≥ 0, monotónní balance | `scenario-sensitivity-nfr.test.ts` |
| Orchestration | Partial results, hash, cache | `service/investment-calculation-service.test.ts` |
| Auth / IDOR | Owner / analyst / public | `precision-auth-nfr.test.ts`, `scenarios/part2b.test.ts`, `lib/security/idor.test.ts` |
| Serialization | DTO JSON round-trip | `precision-auth-nfr.test.ts` |
| Observability | Telemetry + analytics privacy | `observability/telemetry.test.ts` |
| UI VM | Strategy metrics, Neuvedeno/N/A | `hooks/*` |
| SEO | robots noindex zones | `app/seo.test.ts` |

## Golden cases (povinné)

- **G1** Praha LTR baseline — PGI/EGI/NOI/yields/CoC/DSCR/CF
- **G1 cash** — CF = NOI, DSCR undefined
- **Mortgage** — 0 %, 5 %/30y, short term, balance ≈ 0
- **IRR** — known positive, known negative
- **Break-even occupancy** — opex/PGI cash

Fixtures: `engine/__fixtures__/golden-cases.ts`

## Acceptance criteria

1. Žádný test neinventuje 0 za `null` vstup.
2. DSCR cash → N/A; own-use yield → N/A.
3. Záporný CF / záporný IRR nefailuje suite.
4. Sensitivity one-way 21 shocks &lt; 500 ms.
5. `INVESTMENT_ENGINE_VERSION` / `FORMULA_REGISTRY_VERSION` asserted.
6. Analytics events bez forbidden keys (`amount`, `price`, …).

## Příkazy

```bash
npm test -- src/domains/investment
npm run typecheck
npm run lint
```

## Manuální / E2E (doplňkové)

- Kalkulačka `/kalkulacky/investicni-vynos`: změna slideru → přepočet, sr-only heatmap
- Save scenario: nepřihlášený → login; přihlášený → persist s verzemi
- Účet `/ucet/*` → `noindex` v metadata

## Out of scope tohoto plánu

- E2E Playwright full mortgage bank handoff
- Prompt 12 ARV / max bid / renovation estimator tests
