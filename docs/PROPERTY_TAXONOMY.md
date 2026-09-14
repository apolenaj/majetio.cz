# PROPERTY_TAXONOMY

**Prompt 17.3** — Canonical Property Taxonomy, unit conversion, location graph & market UI plugins.

Navazuje na `docs/INTERNATIONAL_ARCHITECTURE.md` (17.1) a `docs/CURRENCY_AND_I18N.md` (17.2).

**Typed Extensions / import adapters / text provenance:** [`docs/INTERNATIONAL_PROPERTY_MODEL.md`](./INTERNATIONAL_PROPERTY_MODEL.md).

## 1. Canonical Property Taxonomy

Stable codes in `src/domains/properties/taxonomy/canonical-types.ts`:

`APARTMENT` · `HOUSE` · `VILLA` · `TOWNHOUSE` · `LAND` · `COMMERCIAL` · `STUDIO` · `OTHER`

| Layer | Role |
| --- | --- |
| Canonical | Cross-market identity + analytics roll-ups |
| Market aliases | Local labels (CZ *rodinný dům*, AE *villa*) → canonical |
| Prisma `PropertyType` | Persistable subset (`VILLA`, `TOWNHOUSE` added; `STUDIO` → `APARTMENT` + layout) |

```ts
resolveCanonicalPropertyType({ marketCode: "AE", raw: "villa" }); // VILLA
toAnalyticsPropertyType("VILLA"); // HOUSE (engines without villa grain)
toPrismaPropertyType("STUDIO"); // APARTMENT
```

## 2. Dual layout model

- **Analytics:** `bedrooms` / `bathrooms` (`CanonicalLayout`)
- **UI:** market notation via `MarketPlugin.property.layoutNotation`
  - CZ / SK → `CZ_DISPOSITION` (`3+kk`)
  - AE / ES / … → `BEDROOM_COUNT` (`3 bedrooms, 2 baths`)

Helpers: `parseLayoutToCanonical`, `formatLayoutForMarket`, `resolveCanonicalLayout`.

## 3. Area units (centralized)

Canonical storage: **m²** (`usableArea` / `areaSqm`).

`src/domains/properties/units/area.ts`:

- `toCanonicalSqm` / `fromCanonicalSqm`
- `formatAreaValue` / `pricePerDisplayArea`
- AE display uses `sqft` from plugin `areaUnit` — **never** convert in React ad-hoc

## 4. Market Section Plugins

Detail sections = core list + extras from `detailSectionExtraIds` on the market plugin.

| Market | Extras |
| --- | --- |
| CZ / SK | `svj`, `penb` |
| AE | `freehold`, `service_charge`, `payment_plan`, `off_plan` |

UI: `resolvePropertyDetailSections` + `buildPropertyDetailNavSections` → `PropertyDetailSectionNav({ marketCode })`.  
**No** `if (country === 'CZ')` in section components.

## 5. Generic Location Graph

Persistence already: `Location { type, parentId, countryCode, … }`.

Per-market labels: `LocationTypeRegistry` (`src/domains/locations/market/location-type-registry.ts`):

| Market | Role examples |
| --- | --- |
| CZ | kraj / okres / obec / městská část |
| AE | emirate / community / building (mapped onto REGION / NEIGHBORHOOD / MICRO_LOCATION) |

Helpers: `buildLocationPath`, `assertValidParentChild`, `labelForLocationType`.

## 6. MarketSearchFilterRegistry

Shared: `query`, `price`, `propertyType`, `area`, `marketChannel`.

Extras from `searchFilterExtraKeys`:

| Market | Extras |
| --- | --- |
| CZ | layout, ownership, condition, energy |
| AE | bedrooms, bathrooms, freehold, offPlan, serviceChargeMax, paymentPlan |

`resolveSearchFiltersForMarket(marketCode)`.

## 7. Primary vs secondary + off-plan

Prisma + domain:

| Field | Meaning |
| --- | --- |
| `listingMarketChannel` | `PRIMARY_NEW_BUILD` \| `SECONDARY_RESALE` |
| `isOffPlan` | Sold before / during construction |
| `constructionStatus` | ANNOUNCED → HANDED_OVER |
| `expectedCompletion` | Handover date |
| `developerName` / `projectName` / `constructionProgressPct` | Project metadata |
| `marketCode` | Market registry code on Property |

Domain framework: `src/domains/properties/taxonomy/listing-channel.ts`.

## Migration

`prisma/migrations/20260721160000_property_taxonomy_offplan/`
