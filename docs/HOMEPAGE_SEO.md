# Homepage SEO — Majetio.cz

Související: `SEO_ARCHITECTURE.md`.

## Metadata (homepage)

Zdroj: `src/app/(public)/page.tsx` + `homepageSeo` v `src/config/homepage.ts`.

| Pole | Hodnota |
| --- | --- |
| Title | Zjistěte, zda se nemovitost skutečně vyplatí koupit \| Majetio |
| Description | Hero subheadline (produktové vysvětlení) |
| Canonical | `/` |
| Robots | index, follow |
| Open Graph | title, description, url, locale `cs_CZ`, image 1200×630 |
| Twitter | `summary_large_image` + stejný OG image |

## Structured data

| Typ | Obsah |
| --- | --- |
| Organization | Název, URL, popis, logo |
| WebSite | URL, jazyk, SearchAction → `/nemovitosti?q={search_term_string}` |
| FAQPage | 8 otázek z `homepageContent.faq` |

**Nezařazeno záměrně:** `RealEstateListing` pro demo nabídky.

## On-page

- Jeden H1 (hero)
- H2/H3 hierarchie v sekcích
- Interní odkazy na analýzu, katalog, metodiku, ceník
- Skip link `#main-content` (root layout)

## Indexace demo obsahu

Demo bloky jsou v obsahu jasně označené. Sitemap zahrnuje `/`; demo detail slugy mohou mít `noindex` dle detail page metadata.
