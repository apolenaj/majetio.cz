# SUBSCRIPTIONS

Předplatná Majetio — Investor Pro (B2C) a B2B SaaS plány. Žádné tiché auto-renewal.

## Aktivační pravidlo

Předplatné se **aktivuje až po** `payment.succeeded` (Order `PAID` → grant).  
UI nesmí tvrdit „členství aktivní“ před webhookem.

Free B2B (`agent_free`) může vzniknout přes `FREE_CHECKOUT`.

## Produkty

| productKey | Segment | Obnova |
| --- | --- | --- |
| `investor_pro_monthly` / `investor_pro_annual` | Investoři | Explicitní souhlas |
| `agent_pro` | Makléři | Explicitní souhlas |
| `agency_growth` | Makléři / RK | Explicitní souhlas |
| `developer_standard` | Developeři | Explicitní souhlas |

`agent_free` je capovaný free tier (5 nabídek), ne placené subscription.

## Renew consent

`subscriptionRenewConsentDefaults()` (`src/domains/subscriptions/`):

- `autoRenewDefault = false`
- checkbox obnovy **není** předzaškrtnutý (`renewConsentInitialChecked()`)
- dark-pattern ban viz `docs/PRICING_MODEL.md` § 128

## Investor Pro lifecycle

Statusy na `Entitlement`: `TRIAL` → `ACTIVE` → `PAST_DUE` (grace) → `CANCELLED` / `EXPIRED`.

API: `grantInvestorPro`, `transitionInvestorProLifecycle`, `nextInvestorProState`.

Eventy: `trial_end`, `payment_failed`, `payment_succeeded`, `cancel`, `period_end`, `renew_consented`.

## B2B plan změna po platbě

Webhook → `grantEntitlementForPaidOrder` → `changeOrganizationPlan`:

- upgrade: obnoví kapacitu z `OVER_LIMIT`
- downgrade: excess → `OVER_LIMIT` (**nemáže** inzeráty)

Order musí nést `organizationId` (nebo OWNER/ADMIN membership uživatele).

Detail limitů: `docs/B2B_PLANS.md`.

## Kód

- `src/domains/subscriptions/`
- `src/domains/entitlements/service.ts` (`grantInvestorPro`, lifecycle)
- `src/domains/organizations/service.ts` (`changeOrganizationPlan`)

## Související

- `docs/ENTITLEMENTS.md`
- `docs/B2B_PLANS.md`
- `docs/PRICING_MODEL.md`
