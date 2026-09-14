# COMMERCE_DATA_LAYER

Datově řízený ceník, promo, objednávky a platební webhooky pro Majetio.

Navazuje na `docs/PRODUCT_VISION.md` (business model) a `docs/DATABASE_DESIGN.md` (Order/Payment).  
Detail checkout UX: `docs/PAYMENTS.md`.

## Principy

1. **Ceny nejsou v UI** — React komponenty načítají `PricingPlan` přes `listActivePricingPlans()`.
2. **Server-side quote** — klient nikdy neposílá `amount`; sleva jen přes validovaný `Promotion`.
3. **Snapshot při nákupu** — `OrderItem` ukládá unit/line ceny, versionKey, features/limits; historická objednávka se nepřepočítává.
4. **Webhook** — signature + timestamp (replay), idempotence `(provider, eventId)`, mapování statusů.

## Modely

### PricingPlan

| Pole | Význam |
| --- | --- |
| `key` + `versionKey` | Stabilní produkt + verze (unique) |
| `billingType` | `ONE_TIME` \| `SUBSCRIPTION` \| `USAGE` |
| `priceGrossMinor` | List price v haléřích (CZK) |
| `limits` / `features` | JSON limity a feature flags |
| `status` | `DRAFT` \| `ACTIVE` \| `ARCHIVED` |
| `activeFrom` / `activeTo` | Časová platnost verze |

Seed: free `basic_analysis`, paid `full_analysis` (4 990 Kč), `enterprise`,
plus B2C `deep_analysis`, `buyer_pass`, `investor_pro_monthly`, `investor_pro_annual`,
plus B2B `agent_free`, `agent_pro`, `agency_growth`, `developer_standard`,
plus listing Boost `boost_7_days`, `boost_30_days` (sponsored only — viz `docs/LISTING_PROMOTIONS.md`).

B2C access layer: `docs/ENTITLEMENTS_B2C.md`.  
B2B organizations / listing quotas: `docs/ORGANIZATIONS_B2B.md`.
Listing promotions: `docs/LISTING_PROMOTIONS.md`.
Revenue attribution / B2B lead fees: `docs/REVENUE_ATTRIBUTION.md`.

### Promotion

| Pole | Význam |
| --- | --- |
| `code` | Unique promo kód |
| `discountType` | `PERCENT` (bp) \| `FIXED_CZK` (minor) |
| `planKeys` | Allow-list klíčů plánu (prázdné = všechny) |
| `activeFrom` / `activeTo` | Expirace |
| `maxRedemptions` / `maxPerUser` | Abuse limity |

Legacy `PromoCode` zůstává pro zpětnou kompatibilitu; nové kódy → `Promotion`.

### Order / OrderItem / Payment

- `Order` — agregát + billing + `pricingPlanId` / `promotionId`
- `OrderItem` — **price at purchase** (unit list, unit net/vat/gross, line totals, snapshots)
- `Payment` — provider refs, status lifecycle
- `PaymentWebhookEvent` — `eventId` unique, `providerTimestamp`, `replayRejected`

## Webhook status map

`src/domains/commerce/status-map.ts`:

| Provider raw (př.) | Event | PaymentStatus | OrderStatus |
| --- | --- | --- | --- |
| `payment_intent.succeeded` | `payment.succeeded` | SUCCEEDED | PAID |
| `…payment_failed` | `payment.failed` | FAILED | AWAITING_PAYMENT |
| canceled | `payment.cancelled` | CANCELLED | CANCELLED |
| `charge.refunded` | `payment.refunded` | REFUNDED | REFUNDED |
| dispute | `payment.chargeback` | CHARGEBACK | CHARGEBACK |

Replay: timestamp mimo `PAYMENTS_WEBHOOK_TOLERANCE_SEC` → 401 + `replayRejected`.  
Duplicate `eventId` → `{ duplicate: true }`, no-op.

## Code map

| Oblast | Path |
| --- | --- |
| Catalog | `src/domains/commerce/catalog.ts` |
| Promotions | `src/domains/commerce/promotions.ts` |
| Quote | `src/domains/commerce/quote.ts` |
| Status map | `src/domains/commerce/status-map.ts` |
| Order create + items | `src/domains/orders/service/create-order.ts` |
| Webhook | `src/domains/payments/service/webhook-handler.ts` |
| Migration | `prisma/migrations/20260721010000_commerce_data_layer/` |

## Tests

`src/domains/commerce/commerce-data-layer.test.ts` — quote snapshot, promo, status mapping.
