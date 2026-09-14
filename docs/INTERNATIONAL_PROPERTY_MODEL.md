# INTERNATIONAL_PROPERTY_MODEL

Typed Extensions, canonical taxonomy, unit conversion, import adapters, and text localization for multi-market Majetio.

**Related:** [`PROPERTY_TAXONOMY.md`](./PROPERTY_TAXONOMY.md) · [`INTERNATIONAL_ARCHITECTURE.md`](./INTERNATIONAL_ARCHITECTURE.md) · [`REGULATORY_AND_FINANCING.md`](./REGULATORY_AND_FINANCING.md)

## Goals (Rules 147–152, 155–157, 190–192)

1. Support AE / ES / … attributes **without** adding hundreds of nullable columns to `Property`.
2. Keep a **canonical** property model for analytics + cross-market search.
3. Preserve **local UI terminology** (CZ `3+kk`, Dubai “2 bedroom”).
4. Convert areas safely (sqm ↔ sqft) in one place.
5. Import every provider through adapters that emit canonical + typed extensions.
6. Keep original-language titles; mark AI translations with `machineGenerated`.

## Architecture

```
Provider payload
  → Import Adapter (Bayut / Idealista / generic)
  → NormalizedListing (canonical fields + marketExtensions + localizedTexts)
  → parseMarketExtensions(marketCode, bag)  // Zod strict
  → Property core columns + Property.marketExtensions JSONB
      + PropertyLocalizedText rows
```

### Core vs Typed Extensions

| Layer | Storage | Examples |
| --- | --- | --- |
| **Canonical core** | `Property` columns | `marketCode`, `propertyType`, `usableArea` (m²), `bedroomsCount`, `tenureType`, price |
| **Typed Extensions** | `Property.marketExtensions` JSONB (Zod-validated) | AE `furnishing`, ES `cadastralReference`, CZ `penbClass` |
| **EAV fallback** | `PropertyAttribute` | Rare / experimental keys only — not for local enums |

**Never** put UAE-only fields on a CZ property. `parseMarketExtensions` rejects foreign keys and `marketCode` mismatches.

## Typed Extensions (type-safe)

Code: `src/domains/properties/extensions/`

| Type | Market | Schema |
| --- | --- | --- |
| `CzechPropertyAttributes` | CZ | `schemas/czech.ts` |
| `UAEPropertyAttributes` | AE | `schemas/uae.ts` |
| `SpainPropertyAttributes` | ES | `schemas/spain.ts` |

Enums live under `extensions/enums/` — **no free-text** for furnishing, PENB, energy cert, orientation, etc.

```ts
parseMarketExtensions("CZ", { furnishing: "FURNISHED" }); // throws MARKET_MISMATCH
parseMarketExtensions("AE", { marketCode: "AE", furnishing: "FURNISHED" }); // ok
```

## Persistence tradeoff: JSONB vs relational columns

| Approach | Pros | Cons | When |
| --- | --- | --- | --- |
| **Validated JSONB** (`marketExtensions`) | No schema explosion; market plugins evolve independently; one write path | Weaker planner stats; need expression indexes for hot filters | Default for most market fields |
| **Relational tables / columns** | Native indexes, FKs, clearer migrations | Global `Property` pollution or N child tables | High-cardinality filters used in every search |
| **Hybrid (chosen)** | Core filters as columns; market specifics as JSONB + **expression indexes** | Slightly more ops complexity | Production path |

Hot-filter expression indexes (migration `20260721200000_property_market_extensions`):

- AE: `(marketExtensions->>'furnishing') WHERE marketCode = 'AE'`
- ES: `(marketExtensions->>'energyCertificate') WHERE marketCode = 'ES'`

Promote a JSON field to a real column only when query volume justifies it.

## Canonical taxonomy + local UI

Already in `PROPERTY_TAXONOMY.md`:

- Canonical types: `APARTMENT` · `HOUSE` · `VILLA` · `TOWNHOUSE` · `LAND` · `COMMERCIAL` · `STUDIO` · `OTHER`
- Aliases: CZ “3+kk” / “byt” ↔ AE “2-bedroom” / “villa” via `resolveCanonicalPropertyType` + `parseLayoutToCanonical` / `formatLayoutForMarket`
- Analytics uses bedrooms; UI shows market notation

## Area units

`src/domains/properties/units/area.ts` — canonical **m²**.

- `toCanonicalSqm` / `fromCanonicalSqm` / `sqmToSqft` / `sqftToSqm`
- Rejects non-finite and **negative** values (`AreaConversionError`)
- `roundTripCanonicalSqm` for safe UI round-trips

## Import adapters

`src/domains/property-sources/adapters/`

| Adapter | Provider | Emits |
| --- | --- | --- |
| `AeBayutStylePropertySourceAdapter` | Bayut / Property Finder style | AE extensions + ar/en texts |
| `EsIdealistaStylePropertySourceAdapter` | Idealista style | ES extensions + es-ES original |
| `GenericJsonPropertySourceAdapter` | fixtures / partners | Core fields only |

`resolvePropertyImportAdapter({ provider, marketCode })` picks the adapter. Every adapter targets **canonical** `NormalizedListing`.

## Text localization

`PropertyLocalizedText` + `createLocalizedPropertyText`:

- Always store **original** language text.
- Translations are additive (`translatedText` / `translatedLocale`).
- If `translationSource === MACHINE_GENERATED`, **`machineGenerated` must be true** (enforced).

`pickDisplayText` prefers human translation, then machine (flagged), then original.

## Tests

- `src/domains/properties/extensions/extensions.test.ts` — reject foreign attributes, taxonomy, sqm↔sqft, adapters, machine_generated
- Existing `taxonomy.test.ts` — layout + area regression
