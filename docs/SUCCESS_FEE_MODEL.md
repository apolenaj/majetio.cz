# SUCCESS_FEE_MODEL

Dva různé „success fee“ koncepty — nesmí se plést.

## A) Purchase Concierge / Transaction Success Fee (184, 215, 225)

Zastoupení kupujícího při transakci.

| | |
| --- | --- |
| Flag | `TRANSACTION_SUCCESS_FEE_ENABLED` |
| Default | **OFF** (legal review) |
| Public surface když OFF | `null` — žádné CTA / sliby |
| Kód | `src/domains/revenue/success-fee-model.ts` + `feature-flags.ts` |
| Score / ranking | **Neovlivňuje** |

Dokud je flag `false`:

- `getTransactionSuccessFeePublicSurface()` → `null`  
- `assertTransactionSuccessFeeForCheckout()` → `feature_disabled`  
- `PropertyTransaction.conciergeEnabled` se nenastaví z klienta  

## B) B2B Organization SUCCESS_FEE (MODE B)

Podíl Majetio z **provize makléře** po uzavřeném obchodu.

| | |
| --- | --- |
| Org field | `leadBillingMode = SUCCESS_FEE` |
| Výpočet | `computeSuccessFeeAmountMinor(commission, successFeeBps)` |
| Lifecycle | POTENTIAL → verified → invoiced |
| Flag Concierge | **Nezávislé** na Purchase Concierge (`TRANSACTION_SUCCESS_FEE_ENABLED`) |
| Wire | `updatePropertyTransactionStatus(CLOSED)` + `brokerCommissionGrossMinor` → `createSuccessFeePotential` |

Viz `docs/LEAD_BILLING.md` a `docs/REVENUE_ATTRIBUTION.md`.

## Testy

`ranking-integrity.test.ts` — default OFF + MODE B wire  
`professional-services.test.ts` — Concierge scrub  
E2E: `e2e/professional-review.spec.ts` (Concierge nedostupné na ceníku)  
