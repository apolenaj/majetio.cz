# Technical SEO — Majetio App Router

**Kanonická politika:** `docs/SEO_HARDENING.md` (indexability, canonical, sitemap, facety, lifecycle).

## Robots (`src/app/robots.ts`)

Disallow: `/ucet`, `/account`, `/prihlaseni`, `/login`, `/admin`, `/checkout`, `/private`, `/hledat`, `/profi`, `/onboarding`, `/analyza/`, `/api/`, `/dev`.

## Sitemap (`src/app/sitemap.ts` + `domains/seo/sitemap-builders.ts`)

`generateSitemaps` segments:

| id | Content | lastModified |
| --- | --- | --- |
| `static` | Marketing / legal / methodology | `STATIC_PAGE_REVISIONS` (not `Date.now()`) |
| `properties` | Prisma `PUBLIC`+`ACTIVE`+`!isDemo`+clear+quota | `updatedAt` / `publishedAt` |
| `locations` | Indexable location paths only | revision date |
| `guides` | Hub + **published** guides only | article dates |

Private / demo listings never enter the properties segment.

## Metadata

Central: `buildPageMetadata` / `canonicalizePath` in `domains/seo/metadata.ts`.  
`preparePageMeta` and property detail SEO both use it. Query strings are stripped from canonicals.

Property titles/descriptions: type · layout · m² · place · asking price — no keyword stuffing; no valuation mid in Offer.

## JSON-LD

`components/seo/json-ld.tsx` — `JsonLd`, Organization / BreadcrumbList / FAQPage / Article helpers.  
Throws if `AggregateRating` / rating fields are injected.

## Images

Property cards + gallery: meaningful `alt`, width/height, `priority`/`fetchPriority` for LCP.  
`media-public.ts` nulls RESTRICTED/PROHIBITED **and** private/signed/localhost URLs.
