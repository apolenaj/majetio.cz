# LOCALIZATION_ARCHITECTURE

Market + language selection, preferences, RTL readiness, and i18n bundle splitting.

**Related:** [`docs/INTERNATIONAL_SEO.md`](./INTERNATIONAL_SEO.md) · [`docs/MARKET_REGISTRY.md`](./MARKET_REGISTRY.md)

## Principles

1. **Market ≠ Language** — AE can be `en-AE` or `ar-AE`.
2. **Explicit preference** — never derive market from currency; never force-redirect from IP.
3. **CZ URLs stay valid** — unprefixed paths are the default Czech locale (backward compatible).
4. **Lazy catalogs** — international message chunks must not inflate the CZ client bundle.

## Preference storage

| Actor | Storage |
| --- | --- |
| Guest | Cookies `majetio_market` / `majetio_locale` / `majetio_currency` + localStorage mirror |
| Authenticated | Same cookies + `UserProfile.preferredLocale` + `UserMarketProfile` |

Code: `src/domains/i18n/preference/store.ts`, `src/lib/i18n/preference-actions.ts`.

### Geo suggestion (soft only)

`suggestMarketFromGeoCountry(CF-IPCountry | x-vercel-ip-country)` may show `MarketSuggestBanner`.  
**Forbidden:** automatic `Location` redirect based on IP.

## Selectors (a11y)

- `MarketSelector` / `LanguageSelector` — native `<select>`, labels, `lang` on options, min touch 44px
- Wired in `SiteHeader` via `HeaderLocaleControls`
- Keyboard: native select + Escape closes mobile menu (existing)

## i18n bundle splitting

```
src/domains/i18n/messages/
  cs.ts   # default home
  en.ts   # dynamic import()
  ar.ts   # dynamic import() — RTL
  sk|es|it|hr.ts
```

`loadMessageCatalog(locale)` → separate webpack/turbopack chunks per language.

## RTL ready

- Root `<html lang dir>` from locale cookie (`getLocaleDir`)
- Fonts: DM Sans + Source Serif 4 (Latin) + **Noto Sans Arabic** (licensed Google Font)
- Prefer logical CSS (`margin-inline-*`, `padding-inline-*`, `text-align: start|end`)
- `.icon-dir` flips under `[dir=rtl]`

## Cache keys (Rule 208)

Every CDN / internal cache key MUST include:

`market` · `locale` · `currency` · `version`

```ts
buildInternationalCacheKey({ market, locale, currency, resource })
// m:CZ:l:cs-CZ:c:CZK:v:2026.07.21:r:/nemovitosti
```

Middleware sets `x-majetio-market|locale|currency|cache-version|cache-key`.

## Request flow

```
Request
  → cookies / UserMarketProfile (explicit)
  → optional geo *suggestion* header (no redirect)
  → SiteHeader selectors + soft banner
  → preparePageMeta → hreflang/canonical
```
