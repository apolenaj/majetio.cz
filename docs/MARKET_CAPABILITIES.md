# MARKET_CAPABILITIES

Capability Matrix, kill switches, org coverage, entitlement marketScope, config review.

**Related:** [`INTERNATIONAL_ARCHITECTURE.md`](./INTERNATIONAL_ARCHITECTURE.md) · [`REGULATORY_CONFIGURATION.md`](./REGULATORY_CONFIGURATION.md)

## Capability Matrix (Rules 139–146)

Plugin statuses: `FULL` · `BETA` · `LIMITED` · `MANUAL_ONLY` · `NOT_AVAILABLE`

**UI triad** (what components render):

| UI state | From plugin |
| --- | --- |
| `FULL` | FULL, BETA |
| `LIMITED` | LIMITED, MANUAL_ONLY |
| `UNAVAILABLE` | NOT_AVAILABLE (+ kill switch) |

```ts
resolveEffectiveCapability({ marketCode: "ES", capability: "VALUATION" })
// → uiState: UNAVAILABLE, polite message (no throw)
```

UI: `MarketCapabilityNotice` — zdvořilá informace místo „Nemáme data“ / crash. Na detailu nemovitosti (`/nemovitosti/[slug]`) se při `UNAVAILABLE` valuace skryje a zobrazí notice.

Spain (ES) example: `VALUATION: NOT_AVAILABLE` → UNAVAILABLE notice; `PROPERTY_SEARCH: LIMITED` → limited banner.

Admin UI: `/admin/trhy` — Capability Matrix + kill switch toggles (new listings / valuations / lead routing / review_required).

## Kill switches (Rules 209–217)

Per market, immediate:

- `pauseNewListings`
- `pauseValuations`
- `pauseLeadRouting`
- `reviewRequired` (emergency stale regulation)

```ts
applyKillSwitch({ marketCode: "CZ", target: "valuations", enabled: true })
```

Persisted optionally on Prisma `Market.killSwitch` JSON; hot path uses process store.

## Stale regulation → review_required (Rule 220)

`evaluateStaleRegulationForMarket` — ACTIVE rules with missing/old `verifiedAt` set `reviewRequired` on the market. Effective capabilities demote sensitive FULL → LIMITED while flag is on.

## Config review flow (225–230)

Statuses: **DRAFT → REVIEWED → ACTIVE → RETIRED** (+ SUPERSEDED).

- Cannot edit ACTIVE in place — new DRAFT version
- Production calculators consume **ACTIVE** only (`isProductionConfigStatus`)

## Organizations

- `marketCode` — primary
- `marketCoverage: string[]` — markets the org may serve
- `serviceType` — `AGENCY` \| `BROKER` \| `DEVELOPER` \| `MIXED` \| …

## CRM / Leads

`listAccessibleLeads({ marketCode })` — primary market filter.

## Entitlements marketScope (196)

```ts
Entitlement.marketScope = ["CZ"]  // Buyer Pass CZ
// does NOT unlock AE
assertEntitlementMarketScope({ productKey, marketScope, requestedMarketCode: "AE" }) // throws
```

Use `["*"]` only for explicitly global products.
