# INTERNATIONAL_TEST_PLAN

Test plan for Majetio multi-market isolation & regression (Rules 198, 200–205).

**Related:** [`MARKET_LAUNCH_PROCESS.md`](./MARKET_LAUNCH_PROCESS.md) · [`INTERNATIONAL_ARCHITECTURE.md`](./INTERNATIONAL_ARCHITECTURE.md) · [`MARKET_CAPABILITIES.md`](./MARKET_CAPABILITIES.md)

## Goals

1. **Isolation** — CZ config / tax / financing / valuation must never leak into AE (or other markets).
2. **i18n fallback** — Missing keys fall back EN → CS; legal namespaces never ship machine-only.
3. **CZ regression** — Majetio.cz public flows stay green (home, listings, analysis, pricing).
4. **Public DTO contract** — Responses include `market` / `marketCode`, local `currency`, localized `labels` without breaking CZ clients that ignore new fields.
5. **Launch gate** — LIVE blocked until readiness checks pass.

## Test layers

| Layer | Tool | Scope |
| --- | --- | --- |
| Unit / isolation | Vitest | Market plugins, tax, FX, entitlements marketScope, kill switches, readiness LIVE barrier, i18n fallback, public DTO shape |
| Integration | Vitest | Capability matrix ES reflection, CRM marketCode filter, org coverage |
| E2E regression | Playwright | Majetio.cz IA (`e2e/home.spec.ts`, `e2e/i18n-seo.spec.ts`, `e2e/multi-market.spec.ts`) |
| Synthetic demos | Vitest + E2E negative | ES / AE / HR demo records (`isDemo`) — **never** public listings |

## Isolation suites (must pass)

```bash
npx vitest run src/domains/markets src/domains/i18n/localization.test.ts src/domains/finance/currency-pricing-fx.test.ts src/domains/entitlements
```

| Case | Expectation |
| --- | --- |
| CZ VAT 21% | Does not change AE tax provider rate |
| CZ HypotekaJasne | Not selected for AE financing |
| CZ valuation FULL | ES valuation UNAVAILABLE (Capability Matrix) |
| Buyer Pass `marketScope=["CZ"]` | Denies AE |
| Kill switch CZ valuations | Does not pause AE unless applied to AE |
| Message missing in `es` | Falls back to `en`, then `cs` |

## E2E regression (Majetio.cz)

```bash
npx playwright test e2e/home.spec.ts e2e/i18n-seo.spec.ts e2e/multi-market.spec.ts
```

| Case | Expectation |
| --- | --- |
| `/` | Brand + Demo marker + primary CTA |
| `/nemovitosti` | CZ demo listings only — no Madrid / Dubai / Split public cards |
| Unprefixed CZ URLs | Still work (no forced `/cs` prefix) |
| Geo `AE` header | Soft suggest only — no auto-redirect |

## Synthetic international demos

Source: `src/content/international-demo-properties.ts`

| Slug | Market | Role |
| --- | --- | --- |
| `demo-es-apartment-barcelona` | ES | Spain apartment (QA) |
| `demo-ae-apartment-dubai` | AE | Dubai apartment (QA) |
| `demo-hr-holiday-split` | HR | Croatia holiday property (QA) |

Rules:

- `isDemo: true`, titles contain „Demo“
- `visibility: PRIVATE` — **not** indexed in public `/nemovitosti`
- Never seed as production inventory

## Public DTO contract

`toPublicPropertyDto` always emits:

- `marketCode` + `market` (same value; alias for API clarity)
- `currency` (local listing currency)
- `labels` (`propertyType`, `propertyTypeEn`, `market`, `marketLocal`, `demoBadge`)

CZ clients that only read legacy fields remain compatible.

## Definition of Done (this plan)

- [x] Isolation Vitest green
- [x] i18n fallback Vitest green
- [x] Public DTO shape Vitest green
- [x] LIVE barrier Vitest green
- [x] Playwright CZ regression + multi-market negative checks green
