# REVENUE_ATTRIBUTION

B2B monetizace leadů + kanonický revenue ledger (bez dvojího započítávání).

Fáze 6 rozšíření (admin metriky, GMV≠revenue, reconciliation, audit): viz **`docs/REVENUE_LEDGER.md`**.

## Billing módy organizace

Nastavení na `Organization`:

| Pole | Význam |
| --- | --- |
| `leadBillingMode` | `PAY_PER_LEAD` (MODE A) \| `SUCCESS_FEE` (MODE B) |
| `payPerLeadPriceMinor` | Cena za kvalifikovaný lead (haléře) |
| `successFeeBps` | Podíl z provize makléře (1000 = 10 %) |
| `attributionWindowDays` | Attribution window (default 30) |

```
MODE A  accept/deliver QualifiedBuyerLead → chargePayPerLead → RevenueEvent(PAY_PER_LEAD)
MODE B  deal closed → SuccessFeeRecord(POTENTIAL) → verify → RevenueEvent(SUCCESS_FEE)
Commerce  payment.succeeded → recognizeCommerceRevenueForPaidOrder → RevenueEvent(SUBSCRIPTION|ANALYSIS|…)
```

API: `setOrgLeadBillingMode`, `chargePayPerLead`, `createSuccessFeePotential`, `verifySuccessFee`.

## SuccessFeeRecord

Lifecycle: `POTENTIAL` → `PENDING_VERIFICATION` → `VERIFIED` → `INVOICED` → `PAID`  
(alternativně `DISPUTED` / `CANCELLED` / `WRITTEN_OFF`)

| Pole | Účel |
| --- | --- |
| `brokerCommissionGrossMinor` | Skutečná provize makléře (marketplace GMV proxy) |
| `feeBps` / `feeAmountMinor` | Snapshot sazby + vypočtený poplatek Majetio (**revenue**, ne GMV) |
| `revenueEventId` | Vazba na ledger po VERIFIED |

`verifySuccessFee` píše monetization audit (`success_fee.verify`).

## Canonical RevenueEvent

Jedna ekonomická událost = jeden řádek.

Zdroje: `SUBSCRIPTION` · `ANALYSIS` · `LISTING_BOOST` · `PAY_PER_LEAD` · `SUCCESS_FEE` · `MORTGAGE_PARTNER` · `OTHER`

**Double-count guards (155 / 156):**

1. `@@unique([sourceType, sourceEntityId])`
2. `idempotencyKey` unique (`pay_per_lead:{leadId}`, `success_fee:{feeId}`, `order:{orderId}`, …)
3. `assertNoForcedDoubleAttribution` v `createLeadAttribution` — multi-source → `MULTI_SOURCE_REVIEW`, žádný forced primary
4. `resolveAttributionReview` jen označí primary (audit `attribution.resolve`) — **nevytváří** RevenueEvent

`recordRevenueEvent` je idempotentní — druhý insert vrátí `duplicatePrevented: true`.

## Attribution window

`decideLeadAttribution` / `createLeadAttribution`:

- Touchpointy v `[anchor - windowDays, anchor]`
- **1 sourceKey** → `ATTRIBUTED`
- **>1 distinct sourceKey** → `MULTI_SOURCE_REVIEW` (manuální revize, žádný auto-pick)
- 0 → `UNATTRIBUTED`

## Dispute workflow (ochrana)

Makléř **nemůže** sám zneplatnit billable lead bez evidence:

1. `openLeadDispute` bez evidence → `EVIDENCE_REQUIRED`, **`leadRemainsBillable: true`**
2. `submitDisputeEvidence` → `UNDER_REVIEW`
3. `resolveLeadDispute` (ops/admin):
   - `UPHELD` jen s evidencí → reverse `RevenueEvent`
   - `REJECTED` → lead zůstává billable, revenue zpět `RECOGNIZED`

## Kódová mapa

| Oblast | Path |
| --- | --- |
| Config | `src/config/revenue-attribution.ts` |
| Ledger | `src/domains/revenue/ledger.ts` |
| Metrics / MRR·GMV | `src/domains/revenue/metrics.ts` |
| LTV / CAC | `src/domains/revenue/ltv-cac.ts` |
| Double-attribution | `src/domains/revenue/double-attribution.ts` |
| Commerce recognize | `src/domains/revenue/commerce-recognition.ts` |
| Reconciliation | `src/domains/revenue/reconciliation.ts` |
| Billing | `src/domains/revenue/billing.ts` |
| Attribution | `src/domains/revenue/attribution.ts` + `attribution-service.ts` |
| Disputes | `src/domains/revenue/disputes.ts` |
| Audit | `src/domains/revenue/monetization-audit.ts` |
| Migrace | `prisma/migrations/20260721060000_revenue_attribution/` |

## Testy

`src/domains/revenue/revenue-attribution.test.ts`  
`src/domains/revenue/revenue-ledger-phase6.test.ts`
