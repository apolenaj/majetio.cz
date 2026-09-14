# CRM_ARCHITECTURE

Fáze 4 monetizace — B2B CRM a Broker Dashboard (checklist **133–145**, **162–163**, **174–175**, **185**, **192**).

## Přehled vrstev

| Vrstva | Účel |
| --- | --- |
| Organization + Member | Tenant, plán, ověření, onboarding profil |
| Lead + LeadActivity + LeadAssignment | Interní pipeline (makléř / analytik / SALES) |
| Inquiry | Nezávazný kontakt (≠ kvalifikovaný lead) |
| QualifiedBuyerLead | Marketplace QBL + anonymizace + SLA |
| ListingAnalyticsDaily | Agregáty impressions/saves/inquiries (bez PII) |
| RevenueEvent / SuccessFee | Realized revenue — **oddělené** od expected value |

## Broker surface (`/profi`)

| Route | Popis |
| --- | --- |
| `/profi/onboarding` | Založení org + profil (133/134) |
| `/profi` | Agency Dashboard (135) |
| `/profi/analytics` | Listing Analytics (136) |
| `/profi/profil` | Profil + edit + verification badge (162/163) |
| `/profi/leady` | Qualified Buyer inbox + SLA + accept/respond (138/139) |
| `/profi/pipeline` | CRM pipeline — owner / next action / expected value |

Layout vyžaduje session (`src/app/(broker)/layout.tsx`).

## Ověření (162 / 163)

Odznak (`VerificationBadge` / `resolveVerificationBadge`):

- `UNVERIFIED` → **žádný** odznak  
- `IDENTITY_VERIFIED` → „Ověřená identita“  
- `ORGANIZATION_VERIFIED` → „Ověřená organizace“  

Self-service makléř **nemůže** nastavit ověření — jen admin (`setOrganizationVerificationByAdmin`).

## Tenant boundaries (174 / 175)

`assertOrganizationAccess`:

- Členství povinné (nebo platform ADMIN)
- Billing / plan: OWNER nebo ADMIN (`requireBilling: true` i v `changeOrganizationPlan`)
- AGENT vidí jen své listingy (`listedByUserId`) uvnitř org
- QBL accept: assignee **nebo** org OWNER/ADMIN (ne každý AGENT)

IDOR testy:

- `src/domains/organizations/broker-crm-phase4.test.ts` (contracts)
- `src/domains/organizations/tenant-idor.test.ts` (runtime mocks)

## CRM entity (142–145, 185)

| Pole | Význam |
| --- | --- |
| `ownerUserId` | Accountable owner pipeline |
| `assignedToUserId` | Operativní assignee |
| `nextActionType` / `DueAt` / `OwnerId` / `Note` | Next action |
| `expectedValueMinor` | **Interní** forecast — ≠ `RevenueEvent` |

Buyer-facing DTO: `toPublicLeadDto` stripuje expected value.  
API: `setLeadOwner`, `setLeadExpectedValue`, `setLeadNextAction`, `listAccessibleLeads`.

## Qualified Buyer SLA (138 / 139)

- Default `slaDueAt` = qualify + 24 h  
- `firstResponseAt` / `slaBreachedAt`  
- Inbox vrací `publicRankingEnabled: false` — **žádný** veřejný ranking makléřů  
- Akce: `recordQualifiedBuyerFirstResponse`, `acceptQualifiedBuyerLead`

## Analytics privacy (136)

`ListingAnalyticsDaily` + `getOrganizationListingAnalytics` → `containsPii: false`.  
Ingest: property detail (impressions), favourite save (saves), inquiry create (inquiries) — **bez** visitor PII.

## Kód

- `src/domains/organizations/` — tenant, onboarding, agency-dashboard  
- `src/domains/crm/` — pipeline, QBL, inbox, lead-value, broker-actions  
- `src/domains/listing-analytics/`  
- Migrace: `prisma/migrations/20260721110000_b2b_crm_broker_dashboard/`

## Testy

- Unit: `broker-crm-phase4.test.ts`, `tenant-idor.test.ts`, `crm-pipeline.test.ts`, `marketplace-leads.test.ts`  
- E2E: `e2e/broker-flow.spec.ts` (192)

## Související

- `docs/SELLER_LISTING_PRODUCTS.md`  
- `docs/CRM_PIPELINE.md`  
- `docs/MARKETPLACE_LEADS.md`  
- `docs/ORGANIZATIONS_B2B.md`  
- `docs/B2B_PLANS.md`  
