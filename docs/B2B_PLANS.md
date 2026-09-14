# B2B_PLANS

B2B SaaS tarify pro makléře, agentury a developery (checklist **180**).

Kontrakt limitů: `src/config/organizations-b2b.ts` (+ `PricingPlan.limits` v DB).

## Tarify

| planKey | Max aktivních nabídek | Seaty | Typ org |
| --- | --- | --- | --- |
| `agent_free` | **5** | 1 | REAL_ESTATE_AGENT |
| `agent_pro` | **40** | 1 | REAL_ESTATE_AGENT |
| `agency_growth` | **200** | 15 | AGENCY |
| `developer_standard` | **500** | 25 (+ projects) | DEVELOPER |

Ceník listových cen: `docs/PRODUCT_CATALOG.md` / `docs/PRICING_MODEL.md`.

## Hlídání limitů

- Publikační gate: `assertCanPublishListing`
- Spotřebovávají kvótu statusy `ACTIVE` / `RESERVED`
- Stav nabídky: `listingQuotaState` = `WITHIN_LIMIT` \| `OVER_LIMIT`

## Downgrade behavior

`changeOrganizationPlan` + `reconcileListingQuota`:

1. **Nikdy nemaž** inzeráty při downgrade  
2. Excess označ `OVER_LIMIT` + `overLimitReason` + CTA (upgrade / archivovat / stáhnout)  
3. Upgrade obnoví nejstarší `OVER_LIMIT` do limitu  
4. Audit: `OrganizationPlanChange`

## Platba → plán

Po webhooku `payment.succeeded` pro B2B `productKey`:

`grantEntitlementForPaidOrder` → `changeOrganizationPlan({ organizationId, toPlanKey })`

Vyžaduje `Order.organizationId` (checkout) nebo OWNER/ADMIN membership plátce.

Entitlement řádek po platbě je audit trail (`featureKeys: B2B_PLAN`, meta s `planChangeId`).

## Oddělení od B2C

B2B limity žijí na `Organization`, ne na B2C `Entitlement` feature keys.

## Testy

- `src/domains/entitlements/entitlements-phase3.test.ts` — OVER_LIMIT reconcile  
- `src/domains/organizations/` — quota / plan change tests  
- E2E smoke: `e2e/entitlements-b2c.spec.ts` (segment Makléři na `/cenik`)

## Související

- `docs/ORGANIZATIONS_B2B.md` — verification, membership  
- `docs/SUBSCRIPTIONS.md` — renew  
- `docs/ENTITLEMENTS.md` — grant po platbě  
- `docs/LISTING_PROMOTIONS.md` — boost ≠ organika  
