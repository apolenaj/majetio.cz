# MARKET_TRANSACTION_COSTS

Versioned closing-cost packs per market — estimates only, never silent cross-market reuse.

**Related:** [`REGULATORY_AND_FINANCING.md`](./REGULATORY_AND_FINANCING.md) · [`CURRENCY_AND_FX.md`](./CURRENCY_AND_FX.md)

## Principles

1. Each pack is **marketCode + currency + version** scoped.
2. CZ pack must not be applied to AE (and vice versa).
3. Lines use structured kinds (`NOTARY`, `REGISTRATION`, `BROKER`, `VAT`, …) — not free text.
4. Output is **estimate-only** (`estimatesOnly: true`) until legally verified.

## Code

| Path | Role |
| --- | --- |
| `src/domains/regulatory/transaction-costs/types.ts` | Pack / line types |
| `src/domains/regulatory/transaction-costs/packs.ts` | `CZ_TRANSACTION_COST_PACK_V2026_07`, AE pack stubs |
| `src/domains/regulatory/transaction-costs/estimate.ts` | Apply pack to a purchase scenario |

## Tax vs transaction costs

| Concern | Layer |
| --- | --- |
| Platform VAT on Majetio products | `TaxProviderConfig` (`src/domains/tax/provider-config.ts`) |
| Property transfer / notary / broker | Transaction cost packs |
| Ongoing income tax haircut | `MarketTaxPlugin` (investment) |

## Example (CZ)

- Notary ~50 bps of price (orientational)
- Katastr fee fixed minor
- Broker buyer/seller bps
- VAT line for new-build when applicable

Always display disclaimer: not legal advice; verify with a conveyancer.
