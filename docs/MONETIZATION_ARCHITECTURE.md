# MONETIZATION_ARCHITECTURE

Přehled monetizační architektury Majetio.cz (fáze 1–7).  
**Mimo rozsah této monetizační dokumentace:** plná i18n / multi-currency checkout.  
Základ Market Registry: **`docs/INTERNATIONAL_ARCHITECTURE.md`** (Prompt 17.1).

## Principy

1. **Server-authoritative pricing** — klient nikdy neurčuje částku.
2. **RevenueEvent ledger** — jediný zdroj uznaných příjmů; GMV ≠ revenue.
3. **Commercial firewall** — Boost / ads neovlivňují Score, valuaci, organiku.
4. **Entitlement po platbě** — grant až po `payment.succeeded` (nebo free checkout = 0).
5. **Legal gates OFF** — sporné features za flagem do review (213–215).
6. **Consent split** — nákupní Terms ≠ marketing (211 / 212).

## Tok peněz

```
Catalog (pricing-architecture)
    → PricingPlan DB
    → Checkout (Terms, no marketing, no client price)
    → Order + Payment (PSP / mock)
    → webhook payment.succeeded
    → Entitlement grant
    → RevenueEvent RECOGNIZED
    → Admin metrics / reconciliation
```

B2B leady:

```
MODE A  QBL accept → PAY_PER_LEAD RevenueEvent
MODE B  deal CLOSED → SuccessFee POTENTIAL → verify → SUCCESS_FEE RevenueEvent
```

## Vrstvy

| Vrstva | Path |
| --- | --- |
| Catalog / flags | `src/config/pricing-architecture.ts`, `feature-flags.ts`, `legal-review.ts` |
| Commerce | `src/domains/commerce/`, `src/domains/orders/` |
| Payments | `src/domains/payments/`, `src/integrations/payments/` |
| Entitlements | `src/domains/entitlements/` |
| Revenue | `src/domains/revenue/` |
| Promotions | `src/domains/listing-promotions/` |
| Fraud | `src/domains/fraud/` |
| Admin | `/admin/monetizace`, `/admin/audit-log`, `/admin/objednavky` |

## Segmenty produktů

B2C Free / Deep Analysis / Buyer Pass · Investor Pro · Seller Boost · B2B Agent/Agency · Developer · Professional services (HITL) · Partner marketplace (OFF).

Detail katalogu: `docs/PRODUCT_CATALOG.md`, `docs/DEVELOPER_PRODUCTS.md`, `docs/PARTNER_MONETIZATION.md`.

## Metriky

`docs/REVENUE_LEDGER.md` — MRR/ARR (recurring), GMV, one-time, LTV/CAC základy.

## Související

- `docs/PAYMENTS.md`, `docs/ENTITLEMENTS.md`, `docs/SUBSCRIPTIONS.md`
- `docs/REVENUE_ATTRIBUTION.md`, `docs/LEAD_BILLING.md`
- `docs/MONETIZATION_LEGAL_REVIEW.md`, `docs/MONETIZATION_TEST_PLAN.md`
- `docs/MONETIZATION_FINAL_REPORT.md` (DoD / bod 228)
