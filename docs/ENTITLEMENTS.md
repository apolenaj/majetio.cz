# ENTITLEMENTS

Fáze 3 monetizace — přístupová práva po potvrzené platbě (checklist **177–179**, B2C **Buyer Pass / Deep Analysis**, Professional Review **132**, manuální **208–209**).

Navazuje na `docs/ENTITLEMENTS_B2C.md` (detail Free / Deep / Pass / Pro) a Commerce `PricingPlan` → `Order` → `Entitlement`.

## Pravidlo grantu (177 / 178 / 179)

| Situace | Entitlement |
| --- | --- |
| `payment.succeeded` webhook → Order `PAID` | **Ano** — `grantEntitlementForPaidOrder` |
| `payment.failed` / `cancelled` | **Ne** |
| Free produkt (`amountGrossMinor = 0`) | Ano, `source = FREE_CHECKOUT` (bez PSP) |
| Klient / UI před webhookem | **Ne** — `assertOrderEligibleForEntitlementGrant` blokuje |

Grant selže → `PENDING_GRANT` + retry (`retryPendingEntitlementGrants`). Refund/chargeback → revoke jen `PAID_ORDER` / `FREE_CHECKOUT` (ne manuální).

## EntitlementService

| API | Účel |
| --- | --- |
| `assertFeatureAccess` | Feature gate + usage (např. `/analyza/[id]/scenare` → `FULL_SCENARIOS`) |
| `grantDeepAnalysis` | 1 property + content version |
| `grantBuyerPass` | 30 dní, limity analýz |
| `grantInvestorPro` | Trial → active lifecycle |
| `grantManualEntitlement` | Admin override (oddělený source) |
| `grantEntitlementForPaidOrder` | Orchestrace po platbě (payments bridge) |
| `checkFeatureAccessAction` | Server action pro UI |

## B2C produkty

### Buyer Pass

- `durationDays = 30`, `deepAnalysesIncluded = 2`
- `billingInterval = NONE`, `meta.autoRenew = false`
- Anti-scrape denní limity view / export / comparison

### Deep Analysis

- Scope: `propertyId` (+ `contentVersionKey`)
- Order nese `propertyId` (nebo resoluce z `analysisId`)
- Jedna zakoupená analýza na property — ne lifetime

### Professional Review (132)

Po `payment.succeeded` pro `expert_review` / `investment_audit`:

1. `createProfessionalServiceRequest` (HITL, ne automatická analýza)
2. Audit `Entitlement` s `meta.professionalServiceRequestId`

## EntitlementSource (208 / 209)

| source | Význam |
| --- | --- |
| `PAID_ORDER` | Placené po webhooku |
| `FREE_CHECKOUT` | Nulová cena |
| `MANUAL_ADMIN` | Admin: `reason`, `expiresAt`, `manualActorUserId` — **bez** `orderId` |

Admin UI: `/admin/uzivatele` (`AdminManualEntitlementsPanel`).  
Manuální revoke jen pro `MANUAL_ADMIN`. Placené řešte refund cestou.

## Soubory

- `src/domains/entitlements/` — service, grant-guard, manual, usage, server actions  
- `src/domains/payments/service/entitlements.ts` — webhook bridge  
- `src/components/entitlements/entitlement-paywall.tsx` — gate UI  
- Migrace: `prisma/migrations/20260721100000_entitlements_subscriptions/`

## Testy

- `src/domains/entitlements/entitlements-phase3.test.ts`
- `src/domains/entitlements/entitlements-b2c.test.ts`
- `src/domains/entitlements/assert-feature-access.test.ts`
- E2E: `e2e/entitlements-b2c.spec.ts` (190 / 191)

## Související

- `docs/SUBSCRIPTIONS.md`
- `docs/B2B_PLANS.md`
- `docs/PROFESSIONAL_SERVICES.md`
