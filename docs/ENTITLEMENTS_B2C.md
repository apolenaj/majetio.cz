# ENTITLEMENTS_B2C

B2C přístupová vrstva nad Commerce Data Layer (`PricingPlan` → `Order` → `Entitlement`).

## EntitlementService

Centrální API: `src/domains/entitlements/service.ts`

| Metoda | Účel |
| --- | --- |
| `assertFeatureAccess` | Gate na feature + anti-scrape usage |
| `grantDeepAnalysis` | Jednorázová analýza property + version |
| `grantBuyerPass` | Časově omezený pass (bez auto-renew) |
| `grantInvestorPro` | Pro membership (trial → active…) |
| `transitionInvestorProLifecycle` | past_due / grace / cancel / expire |
| `recordUsage` / `UsageRecord` | Metriky využití |

Features: `BASIC_SCORE`, `BASIC_RISKS`, `DEEP_ANALYSIS`, `ADVANCED_COMPARISON`, `FULL_SCENARIOS`, `INVESTOR_TOOLS`.

## Majetio Free

Konfig: `majetioFreeConfig` v `src/config/entitlements-b2c.ts`.

- **Vždy** `BASIC_SCORE` + `BASIC_RISKS` — skutečná hodnota, žádný prázdný paywall
- Jednoduché porovnání max 2 nemovitosti (bez `ADVANCED_COMPARISON`)
- Soft anti-scrape: denní limit detail view

## Deep Analysis

- Scope: `propertyId` + `contentVersionKey`
- `expiresAt` / `refreshAfter` (default 90 dní) — **ne lifetime**
- Nová content verze po `refreshAfter` → nutný nový nákup (`version_stale`)

## Buyer Pass

- `durationDays` (30), `billingInterval = NONE`, `meta.autoRenew = false`
- Features včetně `ADVANCED_COMPARISON` + kvóta Deep Analysis v passu
- Anti-scrape: `propertyViewsPerDay`, `exportsPerDay`, `advancedComparisonsPerDay`

## Investor Pro

Lifecycle statusy: `TRIAL` → `ACTIVE` → `PAST_DUE` (grace) → `CANCELLED` / `EXPIRED`

| Interval | Trial | Grace | Period |
| --- | --- | --- | --- |
| Monthly | 7 d | 3 d | 30 d |
| Annual | 14 d | 7 d | 365 d |

Eventy: `trial_end`, `payment_failed`, `payment_succeeded`, `cancel`, `period_end`.

## Checkout mapping

`grantEntitlementForPaidOrder` mapuje `productKey`:

| productKey | Grant |
| --- | --- |
| `deep_analysis` | `grantDeepAnalysis` (vyžaduje propertyId) |
| `buyer_pass` | `grantBuyerPass` |
| `investor_pro_monthly` / `investor_pro` | Pro MONTHLY + trial |
| `investor_pro_annual` | Pro ANNUAL + trial |
| `full_analysis` … | Legacy `LEGACY_PRODUCT` |

## Modely

- `Entitlement` — `kind`, `featureKeys`, `expiresAt`, `refreshAfter`, `gracePeriodEndsAt`, billing period fields
- `UsageRecord` — unique `(userId, featureKey, metricKey, windowKey, scopeKey)`

Migrace: `prisma/migrations/20260721020000_entitlements_b2c/`

## Související

Viz také souhrnný dokument fáze 3: `docs/ENTITLEMENTS.md`, `docs/SUBSCRIPTIONS.md`, `docs/B2B_PLANS.md`.
