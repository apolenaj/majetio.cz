# INTERNATIONAL_FINANCING

Financing & valuation isolation across markets — no CZ leakage into UAE (Rules 160–162).

**Related:** [`REGULATORY_AND_FINANCING.md`](./REGULATORY_AND_FINANCING.md) · [`CURRENCY_AND_FX.md`](./CURRENCY_AND_FX.md)

## FinancingProviderRegistry

`src/domains/financing/providers/registry.ts`

| Provider | Markets | Status |
| --- | --- | --- |
| **HypotekaJasne** | **CZ only** | READY / lead handoff |
| `ae_partner_tbd` | AE | PARTNER_PENDING — not HypotekaJasne |
| `manual_advisor` | fallback | UNAVAILABLE for integrated handoff |

```ts
resolveFinancingProvider("AE").status // PARTNER_PENDING | UNAVAILABLE
resolveFinancingLeadRouting({ marketCode: "AE" }).partner // ≠ hypotekajasne
assertHypotekaJasneCzOnly({ marketCode: "AE", partnerCode: "hypotekajasne" }) // throws
```

Non-supporting markets return **`UNAVAILABLE`** (or partner pending) — never inherit CZ LTV / HypotekaJasne.

## Valuation isolation

`resolveValuationModelForMarket({ marketCode, propertyType })`

- CZ apartment → `CZ_APARTMENT_V1` (READY)
- AE villa → AE model DISABLED — **never** CZ apartment model
- `assertValuationModelMarketMatch` refuses cross-market model use

## Commerce / subscriptions

- `PricingPlan` carries `marketCode`, `taxRegion`, `currency`
- List prices are **local seeds** (`local-pricing.ts`) — CZK 499 ≠ AED 199 via FX
- `assertSubscriptionUnchangedOnMarketSwitch` — preference change does **not** reprice/migrate billing

## Tax Provider Config

`resolveTaxProviderConfig({ marketCode, taxRegion })` → VAT/sales tax rates per region (CZ 21%, AE 5%, ES 21%, …).
