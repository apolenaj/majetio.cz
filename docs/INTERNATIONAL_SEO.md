# INTERNATIONAL_SEO

hreflang, canonical, locale URLs, duplicate-content guards.

**Related:** [`docs/LOCALIZATION_ARCHITECTURE.md`](./LOCALIZATION_ARCHITECTURE.md) · [`docs/SEO_PRIVACY_AND_CROSS_MARKET.md`](./SEO_PRIVACY_AND_CROSS_MARKET.md)

## Hosts

| Host | Role |
| --- | --- |
| `www.majetio.cz` | Authoritative CZ market content |
| `www.majetio.com` | International shell — must **noindex** duplicate CZ pages |

## URL rules (backward compatible)

| Pattern | Meaning |
| --- | --- |
| `/nemovitosti` | CZ default locale (**canonical**, stays valid forever) |
| `/en/nemovitosti` | English — middleware **rewrites** to `/nemovitosti` + sets locale cookie |
| `/markets/ae` | Future country landing (com host) |

**No 301 required** for existing CZ bookmarks — unprefixed paths remain the primary URLs.

If a legacy alias ever moves, use **301** to the unprefixed CZ path (never drop SEO equity).

## Metadata API

`preparePageMeta({ title, description, path, marketCode? })` delegates to:

- `buildSeoDocumentMeta` — canonical absolute URL, robots, index denial reasons
- `toNextAlternates` — `alternates.canonical` + `alternates.languages` (hreflang + `x-default`)

Domain: `src/domains/seo/architecture.ts`.

## hreflang

For each market-supported locale, emit:

```html
<link rel="alternate" hreflang="cs-CZ" href="https://www.majetio.cz/nemovitosti" />
<link rel="alternate" hreflang="en-GB" href="https://www.majetio.cz/en/nemovitosti" />
<link rel="alternate" hreflang="x-default" href="https://www.majetio.cz/nemovitosti" />
```

Built via `buildSeoLocaleRoutes` (empty `pathPrefix` for default language).

## Duplicate / thin content

- CZ pages on `.com` → `robots.index = false` (`duplicate_cz_content_use_majetio_cz`)
- Non-public markets → noindex
- Programmatic landings: `decideProgrammaticIndexability` (real data, sample ≥ 20, `reviewRequiredAt`)

## Cache / CDN

Vary (or key) on market + locale + currency + version — see `buildInternationalCacheKey`.

## Tests

- Domain: `src/domains/seo/seo-privacy-cross-market.test.ts`, `src/domains/i18n/localization.test.ts`
- E2E: CZ regression in `e2e/home.spec.ts` + `e2e/i18n-seo.spec.ts`
