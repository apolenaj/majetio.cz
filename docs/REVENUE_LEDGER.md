# REVENUE_LEDGER

Fáze 6 — kanonický revenue ledger, admin metriky, reconciliation (checklist **146–151**, **153–159**, **196–199**, **200–205**, **207**, **210**).

## Zdroj pravdy

`RevenueEvent` = jediný ledger uznaných příjmů.

| Pole | Účel |
| --- | --- |
| `sourceType` | SUBSCRIPTION / ANALYSIS / LISTING_BOOST / PAY_PER_LEAD / SUCCESS_FEE / … |
| `sourceEntityId` | Idempotentní vazba (Order id, Lead id, SuccessFee id) |
| `status` | PENDING → RECOGNIZED → REVERSED / DISPUTED |
| `amountGrossMinor` | Uznaná částka (haléře) |

**Double-count:** `@@unique([sourceType, sourceEntityId])` + `idempotencyKey`.

Commerce checkout: `payment.succeeded` → `recognizeCommerceRevenueForPaidOrder` (po grantu entitlementu).

## Metriky (striktní oddělení) — 146–151 / 200–205

| KPI | Definice |
| --- | --- |
| **MRR** | Snapshot ACTIVE/TRIAL/PAST_DUE subscription entitlements → měsíční katalogová cena |
| **ARR** | MRR × 12 (jen recurring) |
| **GMV** | Součet `Order.amountGrossMinor` u `PAID` — **není** revenue |
| **One-time sales** | RECOGNIZED ANALYSIS / BOOST / PPL / … v okně |
| **Recognized revenue** | Všechny RECOGNIZED ledger řádky v okně |

`getMonetizationDashboardMetrics()` — admin `/admin/monetizace`.

## LTV / CAC (153 / 154)

- `estimateCustomerLtvMinor` — ARPU × margin / churn (**MRR**, ne GMV)
- `estimateCacMinor` / `resolveCacInputs` — `MARKETING_SPEND_MINOR_30D` + noví platící z PAID orders
- `assertLtvDoesNotUseGmv` — ochrana proti záměně GMV ↔ LTV

## Attribution bez dvojího započtení (155 / 156)

- `assertNoForcedDoubleAttribution` při `createLeadAttribution`
- Manual `resolveAttributionReview` **nepíše** RevenueEvent — billing jen MODE A/B
- Primary musí být z konkurujících touchpointů

## Analytics (157 / 158)

`track()` → `scrubPii()` → `assertAnalyticsSafe` → `getAnalyticsProvider()`.

Zakázané klíče: email, phone, notes, amounts, … (`ANALYTICS_PII_FORBIDDEN_KEYS`).

## Fraud / abuse (159)

`src/domains/fraud` — free-account IP velocity (**high** → block), disposable email, promo abuse, fake listing.

Napojení:

- registrace → `detectFreeAccountVelocity` + audit `fraud.signal.blocked`
- checkout promo → `detectPromotionAbuse`
- listing boost → `detectFakeListingSignals`

## Reconciliation (196–199)

```bash
npm run revenue:reconcile
npm run revenue:reconcile:repair
```

| Kód | Význam |
| --- | --- |
| 196 | PAID bez entitlementu |
| 197 | PENDING_GRANT |
| 198 | PAID bez RevenueEvent |
| 199 | Refund s ACTIVE entitlement / nerozúčtovaným RECOGNIZED |

CI: `.github/workflows/revenue-reconcile.yml` (schedule + dispatch).

## Audit (207 / 210)

`writeMonetizationAuditLog` / `listMonetizationAuditLogs` — pricing, manual entitlements, success fee, refunds, attribution resolve, reconciliation, fraud.

UI: `/admin/monetizace` (feed) + `/admin/audit-log` (filtry).

## Admin UI

`/admin/monetizace` — MRR, ARR, GMV, one-time, LTV/CAC, audit preview.

## Související

- `docs/REVENUE_ATTRIBUTION.md` — MODE A/B, disputes  
- `docs/LEAD_BILLING.md`  
- `docs/PAYMENTS.md`  
