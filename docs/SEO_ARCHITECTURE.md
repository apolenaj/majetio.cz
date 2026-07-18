# SEO Architecture — Majetio.cz

## Základní pravidla

Každá veřejná indexovatelná stránka má:

- unikátní `title` a `description`
- `alternates.canonical`
- Open Graph (title, description, url)
- jeden H1
- interní odkazy
- breadcrumbs + BreadcrumbList JSON-LD tam, kde dává smysl

Helper: `preparePageMeta()` v `src/components/content/page-helpers.tsx`.

## Indexace

| Typ | Index |
| --- | --- |
| Marketing, katalog, strategie, metodika, ceník | index, follow |
| `/hledat` | **noindex** |
| Auth utility | **noindex** |
| `/ucet/*` | **noindex** (+ header `x-robots-tag`) |
| `/admin/*` | **noindex** |
| `/analyza/[id]/*` | **noindex** (robots disallow `/analyza/`) |
| `/dev/*` | **noindex** / prod blocked |

## robots.txt

`src/app/robots.ts` — disallow účet, admin, auth, hledat, dev, soukromé analýzy.
Sitemap: `/sitemap.xml`.

## sitemap

`src/app/sitemap.ts` — pouze hodnotné veřejné cesty (bez query filtrů, bez účtu).

## Structured data

| Typ | Kde |
| --- | --- |
| Organization | Homepage |
| WebSite | Homepage (SearchAction → `/nemovitosti`) |
| BreadcrumbList | PageHeader při breadcrumbs |
| Article | Až u publikovaných článků průvodce |
| FAQPage | Homepage FAQ |
| RealEstateListing | Až při ověřených datech nabídky — **ne** pro demo |

## Canonical a duplicity

- Filtry zůstávají na `/nemovitosti?…` bez samostatných kanonických variant
- Demo detail má canonical na slug, ale označení demo v obsahu
- Slug změny → budoucí 301 (zatím stabilní slugy)

## Interní linking

Viz `INTERNAL_LINKING.md`.
