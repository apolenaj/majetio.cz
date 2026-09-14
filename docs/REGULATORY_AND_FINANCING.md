# REGULATORY_AND_FINANCING

**Prompt 17.4** — Regulatory rules, transaction costs, payment plans, financing & valuation market gates.

Navazuje na `docs/PROPERTY_TAXONOMY.md` (17.3).

## 1. Canonical tenure

Codes: `FREEHOLD` · `LEASEHOLD` · `USUFRUCT` · `COOPERATIVE_RIGHT` · `COMPANY_OWNED` · `OTHER` · `UNKNOWN`

- Domain: `src/domains/regulatory/ownership/tenure.ts`
- Prisma: `CanonicalTenureType` on `Property.tenureType`
- CZ `OwnershipType` (PERSONAL / COOPERATIVE) maps via `tenureFromCzOwnershipType` — complementary, not replaced

## 2. RegulatoryRule (versioned)

| Field | Purpose |
| --- | --- |
| `code` / `version` | Stable id + pack version |
| `validFrom` / `validTo` | Temporal applicability |
| `verifiedAt` / `verifiedBy` | Ops / legal verification |
| `kind` | FOREIGN_OWNERSHIP, LTV_LIMIT, SHORT_TERM_RENTAL, … |
| `requiresLegalVerificationNotice` | Forces disclaimer |

Seed packs: CZ + AE in `src/domains/regulatory/rules/packs/`.  
Registry: `listActiveRegulatoryRules` / `getForeignOwnershipOrientationalView`.  
Prisma mirror: `RegulatoryRule`.

### Legal disclaimer (hard rule)

Majetio **must not** claim “you can definitely buy”.

- `assertNoCertainPurchaseClaim` / `containsForbiddenCertainPurchaseClaim`
- `LEGAL_VERIFICATION_REQUIRED_NOTICE_*`
- Foreign-ownership views always set `certainPurchaseAllowed: false`

## 3. TransactionCostConfig / packs

No universal closing %. Versioned **line items** depend on:

- buyer residency (RESIDENT / NON_RESIDENT)
- buyer entity (NATURAL_PERSON / COMPANY)
- property type
- side (buyer / seller)

`estimateTransactionCosts({ marketCode, purchasePriceMinor, propertyType, buyer })`  
Packs: `cz-tx-costs.v2026.07`, `ae-tx-costs.v2026.07`.  
MarketPlugin still exposes rough bps for dashboards — pack is source of truth.

## 4. PropertyPaymentPlan → Financial Engine

Domain: `src/domains/properties/payment-plan/`

- Phases: BOOKING / DOWN_PAYMENT / CONSTRUCTION / HANDOVER / …
- `expandPaymentPlanSchedule`
- `buildFinancialEnginePaymentBundle` accepts transaction costs + FX snapshot + schedule → acquisition DTO (`fees`) + timed cash events

Prisma: `PropertyPaymentPlan` + `PropertyPaymentPlanPhase`.

## 5. FinancingProviderRegistry

| Provider | Markets | Notes |
| --- | --- | --- |
| `hypotekajasne` | **CZ only** | Direct integration |
| `ae_partner_tbd` | AE | Partner pending — no handoff |
| `manual_advisor` | * | Fallback |

`resolveMortgageLeadRouting` **never** routes non-CZ leads to HypotekaJasne.  
Foreign markets do **not** inherit CZ mortgage regulatory packs.

## 6. ValuationModelRegistry (per market)

| Code | Market | Status |
| --- | --- | --- |
| `CZ_APARTMENT_V1` | CZ | READY (legacy alias `residential_apartment_v1`) |
| `CZ_HOUSE_V1` | CZ | DISABLED |
| `AE_APARTMENT_V1` | AE | DISABLED — “Automated valuation disabled” |
| `AE_VILLA_V1` | AE | DISABLED — never use CZ apartment model |

`resolveValuationModelForMarket({ marketCode, propertyType })`.  
Prisma `ValuationModelRegistry.marketCode` scoped.

## 7. Tax & renovation plugins

- Tax: `src/domains/tax/market/plugins.ts` — CZ limited estimate; AE/others `not_available`
- Renovation: `resolveRenovationCostCatalog(marketCode)` — CZ demo catalog only; else unavailable

## Migration

`prisma/migrations/20260721170000_regulatory_financing_payment_plans/`
