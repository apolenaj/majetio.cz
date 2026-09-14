# SEO Review Checklist — Pre-release

Use before production deploy when routes, metadata, sitemaps, or programmatic landings changed.

## Canonical & duplicates

- [ ] Every indexable page has `<link rel="canonical">` without query/hash
- [ ] Filter / sort URLs do not become canonical (`canonicalizePath`)
- [ ] CZ content on international host is `noindex` where configured (duplicate control)
- [ ] hreflang alternates present for multi-locale surfaces; `x-default` consistent

## Indexability

- [ ] Thin / demo / unpublished programmatic pages → `noindex` (`decideProgrammaticIndexability`)
- [ ] Private zones blocked in `robots.ts`: `/ucet`, `/admin`, `/checkout`, `/prihlaseni`, `/profi`, …
- [ ] Auth and account layouts set `robots: { index: false }`
- [ ] Location landings below sample threshold are not in sitemap and are noindex

## Sitemaps & robots

- [ ] Sitemap entries use real `lastModified` (not request-time `now` for static pages)
- [ ] No private, demo-only, or checkout URLs in public sitemaps
- [ ] `robots.txt` points to sitemap; disallow list reviewed after new private prefixes

## Structured data (JSON-LD)

- [ ] JSON-LD parses as valid JSON
- [ ] No fake `AggregateRating` / invented review counts
- [ ] Offer / Product schema uses real asking price only (no fabricated valuations as offers)
- [ ] Organization / Breadcrumb / FAQ schemas match visible content

## Content quality

- [ ] Title + meta description unique and non-spammy
- [ ] Property / guide pages have factual copy (no AI inventing legal facts)
- [ ] Images: meaningful `alt`, dimensions, LCP priority where applicable
- [ ] Soft-404 / empty search results are noindex or return proper status

## Automation gates

- [ ] `npm run test:seo-check` against staging/production `BASE_URL` passes
- [ ] Vitest `thin-pages-noindex` + `src/app/seo.test.ts` green
- [ ] Playwright `e2e/seo/canonical-jsonld.spec.ts` green on smoke env

## Sign-off

| Role | Name | Date | Notes |
| --- | --- | --- | --- |
| SEO / content | | | |
| Engineering | | | |

Related: `docs/TECHNICAL_SEO.md`, `docs/TESTING_ARCHITECTURE.md`, `scripts/seo/check-seo-quality.ts`
