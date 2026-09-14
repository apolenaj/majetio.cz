# ORGANIZATIONS_B2B

B2B SaaS vrstva pro realitní profesionály na Majetio (agent, agency, developer, partner).

Navazuje na Commerce `PricingPlan` a listing model `Property`.

## Modely

### Organization

| Pole | Význam |
| --- | --- |
| `type` | `REAL_ESTATE_AGENT` \| `AGENCY` \| `DEVELOPER` \| `PARTNER` |
| `verificationStatus` | `UNVERIFIED` → `IDENTITY_VERIFIED` → `ORGANIZATION_VERIFIED` |
| `planKey` / `pricingPlanId` | Vazba na B2B `PricingPlan` |
| `listingsLimit` / `seatsLimit` | Denormalizované limity pro rychlé gate checky |

### OrganizationMember

Role: `OWNER`, `ADMIN`, `AGENT` — unique `(organizationId, userId)`.

### Property (listing ownership)

| Pole | Význam |
| --- | --- |
| `organizationId` | Vlastník inzerátu (org) |
| `listedByUserId` | Agent, který nabídku spravuje |
| `listingOwnerKind` | `AGENT` / `AGENCY` / `DEVELOPER` / `PARTNER` |
| `listingVerificationStatus` | Stejný trust ladder jako org |
| `listingQuotaState` | `WITHIN_LIMIT` \| `OVER_LIMIT` |

## Ověření inzerce

1. **UNVERIFIED** — výchozí, veřejně bez badge
2. **IDENTITY_VERIFIED** — ověřená identita osoby (agent)
3. **ORGANIZATION_VERIFIED** — ověřená firma (IČO / KYC) → propagace na nabídky org

## B2B tarify (`PricingPlan`)

| key | Limit nabídek | Seaty | Cíl |
| --- | --- | --- | --- |
| `agent_free` | **5** | 1 | Makléř free — skutečná hodnota |
| `agent_pro` | 40 | 1 | Makléř Pro |
| `agency_growth` | 200 | 15 | RK Growth |
| `developer_standard` | 500 | 25 | Developer |

Konfig: `src/config/organizations-b2b.ts`  
Seed migrace: `prisma/migrations/20260721030000_organizations_b2b/`

## Upgrade / downgrade

`changeOrganizationPlan` v `src/domains/organizations/service.ts`:

1. Načte limity z `PricingPlan.limits` (fallback config).
2. Seřadí aktivní nabídky (`ACTIVE`/`RESERVED`) od nejnovější.
3. **Upgrade** — obnoví `OVER_LIMIT` → `WITHIN_LIMIT` do nového limitu.
4. **Downgrade** — **neodstraňuje** inzeráty; excess → `OVER_LIMIT` + `overLimitReason` + `actionRequired` CTA (`upgrade_plan` / `archive_other` / `withdraw_listing`).
5. Zápis do `OrganizationPlanChange`.

Public discovery by měla filtrovat `listingQuotaState = WITHIN_LIMIT` (nebo ekvivalent).

## API povrch

| Metoda | Účel |
| --- | --- |
| `createOrganization` | Tenant + OWNER member + INITIAL plan change |
| `addOrganizationMember` | Seat gate dle `seatsLimit` |
| `setOrganizationVerification` | Trust ladder + propagate na Property |
| `attachPropertyToOrganization` | Propojení inzerátu s org / agentem |
| `assertCanPublishListing` | Gate před publikací |
| `changeOrganizationPlan` | Upgrade / downgrade + quota reconcile |
| `reconcileListingQuota` | Pure helper (testovatelný) |

## Testy

`src/domains/organizations/organizations-b2b.test.ts`
