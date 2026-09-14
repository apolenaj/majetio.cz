# PAYMENTS

Fáze 2 monetizace — Core Checkout, payment processing a security.

> Checklist body IDs v tomto dokumentu (129, 170, 173, …) patří k **commerce epiku**.
> Nesmí se zaměňovat s Decision Workspace BOD čísly ve starších docs.

## Scope

| Zahrnuto | Mimo scope (zatím) |
| --- | --- |
| Checkout UX, Order/Payment, Entitlement | CRM lead orchestration |
| Webhook signature + idempotence | Produkční PSP (Comgate/GoPay/Stripe) — zatím `mock` |
| Refund / chargeback / storno | Marketplace multi-vendor |
| VAT display, price versions, promo | — |

## Allowed currencies (173)

Pouze **CZK** (`commerceConfig.allowedCurrencies` / `assertCommerceCurrency`).
Jiná měna → server error před vytvořením objednávky.

## Checkout flow (129)

```
Select product → Review (+ VAT + promo) → Billing info → Payment provider
  → Payment confirmation (webhook) → Entitlement grant → Success
```

UI:

- `/checkout` — wizard (kroky 1–4); produkty z `listActivePricingPlans`
- `/checkout/mock-pay` — dev PSP (success / fail / cancel)
- `/checkout/success` — kroky confirmation → entitlement → success
- `/checkout/cancel`
- `/ucet/objednavky` — historie (drží `priceVersionKey` + DPH split)
- `/admin/objednavky` — admin storno (122/189)
- `POST /api/payments/webhook` — provider events
- `POST /api/payments/mock-complete` — pouze `PAYMENTS_PROVIDER=mock` (vč. refund/chargeback)

Klient **nikdy** neposílá částku — viz `parseCheckoutOrderInput` + `resolveCanonicalCheckoutAmount`.

## Security (170)

1. **Server-side verification** — cena, DPH, promo a měna jen na serveru (`createCheckoutOrder`).
2. **Webhook signature** — HMAC SHA-256 (`x-majetio-payments-signature` + timestamp), timing-safe compare, replay window.
3. **IDOR** — `getOrderForUser({ userId, orderId })`; session `userId` nikdy z body; manuální storno vlastníka přes `createManualRefund`.
4. **Secrets** — `PAYMENTS_SECRET_KEY`, `PAYMENTS_WEBHOOK_SECRET` jen v server env (viz `.env.example`). Nikdy v klientském bundle.

## Webhooks & idempotency (121, 131, 176)

Tabulka `PaymentWebhookEvent` unique `(provider, eventId)` + `upsert` claim.

| Event | Efekt |
| --- | --- |
| `payment.succeeded` | Order `PAID` + grant entitlement + ledger recognition |
| `payment.failed` | Payment `FAILED`, **žádný** entitlement |
| `payment.cancelled` | Order `CANCELLED`, žádný entitlement |
| duplicate `eventId` (už `processedAt`) | `duplicate: true`, no-op |
| `payment.refunded` | `PaymentRefund` + revoke entitlement |
| `payment.chargeback` | Order `CHARGEBACK` + revoke |

## Failure handling (195, 168)

- Selhání platby → entitlement se **nevytvoří**.
- Platba OK, grant spadne → `Entitlement.status = PENDING_GRANT` + `retryPendingEntitlementGrants()`.
- Success page: „přístup se dokončuje“ (graceful fallback).
- Recovery skript: `scripts/reconcile-payments-entitlements.ts` (`--repair`).

## Refunds & storno (122, 189)

| API | Kdo |
| --- | --- |
| `applyRefundOrChargeback` | Webhook / interní |
| `createManualRefund` | Vlastník objednávky (IDOR) |
| `createAdminRefund` / `adminRefundOrderAction` | ADMIN / SUPER_ADMIN |

Efekt: `PaymentRefund` row → status Order/Payment → `revokeEntitlementsForOrder`.

## VAT / price versions / promo (186–188)

- Ceny **včetně DPH**; split `splitGrossVat` (21 % = 2100 bp).
- **PricingPlan** (`key` + `versionKey`) — runtime ceník.
- `Order` / `OrderItem` drží **price snapshot** — stará objednávka se nepřepočítá.
- `Promotion` PERCENT (bp) / FIXED_CZK (minor) + redemptions; legacy `PromoCode` podporován.

Viz `docs/COMMERCE_DATA_LAYER.md`, `docs/PRICING_MODEL.md`.

## Env

```
PAYMENTS_PROVIDER=mock   # none | mock
PAYMENTS_SECRET_KEY=
PAYMENTS_WEBHOOK_SECRET=
PAYMENTS_WEBHOOK_TOLERANCE_SEC=300
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Code map

| Oblast | Path |
| --- | --- |
| Config | `src/config/commerce.ts` |
| Provider | `src/integrations/payments/` |
| Orders | `src/domains/orders/` |
| Payments | `src/domains/payments/service/` |
| Admin storno | `src/domains/payments/server/admin-actions.ts` |
| UI | `src/components/checkout/`, `src/app/(account)/checkout/` |

## Tests

| Soubor | Checklist |
| --- | --- |
| `pricing.test.ts` | 186 DPH, 187 historické ceny, 188 promo, 173 CZK |
| `webhook-security.test.ts` | 170 signature + IDOR/secrets contracts |
| `webhook-handler.test.ts` | 121/131/176 success/fail/cancel/dup/refund/chargeback |
| `refunds.test.ts` | 122/189 storno / partial / chargeback / IDOR |
