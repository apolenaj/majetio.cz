# SEO_PRIVACY_AND_CROSS_MARKET

**Prompt 17.5** — SEO architecture, privacy registries, user market profiles, cross-market comparison, programmatic SEO, launch readiness.

Navazuje na `docs/REGULATORY_AND_FINANCING.md` (17.4).

## 1. SEO: majetio.cz vs majetio.com

| Host | Role |
| --- | --- |
| `www.majetio.cz` | CZ home market — authoritative Czech content |
| `www.majetio.com` | International shell / multi-market hub |

Rules (`src/domains/seo/architecture.ts`):

- **Canonical** = rendered language variant on the correct host
- **hreflang** = all supported locales for the *active* market + `x-default`
- CZ content on `.com` → **noindex** (`duplicate_cz_content_use_majetio_cz`)
- Non-public markets → noindex

### URL structure

**CZ (`majetio.cz`):**

- `/lokality` · `/lokality/{kraj}/…`
- `/nemovitosti/{city}` — curated city landings only

**International (`majetio.com`):**

- `/markets/{code}` — country landing
- `/markets/{code}/locations/…` — hierarchy
- `/{lang}/…` for non-default locales

Market is **not** duplicated in path on `.cz`. Future: `ae.majetio.com` without `/markets/ae`.

Helpers: `buildSeoDocumentMeta`, `toNextAlternates`, `buildCountryLandingPath`, `buildLocationHierarchyPath`.

## 2. MarketDataSourceRegistry

`src/domains/markets/data-sources/registry.ts` — per-market evidence of data origin (listings, stats, FX, …) with license + `seoCitation`.

`marketHasMinimumSeoDataCoverage(marketCode)` gates programmatic indexability.

## 3. PrivacyPolicyRegistry

`src/domains/privacy/policy-registry.ts` — versioned privacy/terms per market + locale.

- `getCurrentPrivacyPolicy` / `requiresReconsent`
- **Data minimization:** `assertPassportFieldAllowed` blocks `taxResidenceCountry`, national IDs, etc. without justification

Prisma: `ConsentVersion.marketCode` + `locale`.

## 4. UserMarketProfile + international Financial Passport

`src/domains/identity/user-market-profile.ts`

- Global identity + **per-market** preferences (locale, currency, budget in **minor units**, locations)
- Money is **currency-tagged** — not CZK-only
- Legacy CZ passport maps via `userMarketProfileFromLegacyCzPassport`

Prisma: `UserMarketProfile`.

## 5. Cross-Market Comparison Engine

`src/domains/comparisons/cross-market/engine.ts`

- Normalizes asking price, transaction costs, financing into a **display currency** via frozen FX snapshots
- Sets **`fxExposure`** flag + warning `cross-market-fx-exposure`
- Regulatory warning when markets differ
- Wired into `buildComparisonWarnings` when `marketCode` / `currency` provided on properties

## 6. Programmatic SEO

`src/domains/seo/programmatic-rules.ts`

Index **only** when:

- real data + published + not demo
- market publicly active
- data-source coverage OK
- location pages: sampleCount ≥ 20
- legal/financial: `reviewRequiredAt` present and not overdue

Stale legal/financial → `staleContent` + warning copy; blocking reason prevents index.

Prisma: `ProgrammaticSeoDocument`.

## 7. MarketLaunchReadiness

Statuses: **BLOCKED → IN_PROGRESS → READY_INTERNAL → READY_PUBLIC**

Checks: property data, valuation (optional), regulatory pack, privacy docs, transaction costs, financing, SEO coverage, launch flags.

`evaluateMarketLaunchReadiness` / admin dashboard rows include `launchReadiness`.

## Migration

`prisma/migrations/20260721180000_seo_privacy_user_market_profile/`
