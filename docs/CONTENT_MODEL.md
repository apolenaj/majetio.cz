# Content Model — Majetio.cz

CMS-agnostický model pro lokální obsah → pozdější CMS.

## Společná pole

```ts
type ContentBase = {
  id: string;
  slug: string;
  title: string;
  perex?: string;
  body?: string; // MD/MDX nebo rich text
  status: "draft" | "demo" | "published" | "archived";
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  author?: { name: string; role?: string };
  publishedAt?: string; // ISO
  updatedAt?: string;
  category?: string;
  tags?: string[];
  sources?: { label: string; url?: string }[];
  relatedSlugs?: string[];
  cta?: { label: string; href: string };
};
```

## Typy

| Typ | Extra pole | Lokace dat (fáze IA) |
| --- | --- | --- |
| Strategy | audience, pros, risks, capital, metrics, mistakes | `src/content/strategies.ts` |
| GuideArticle | readingMinutes, category | `src/content/guides.ts` |
| LocationProfile | region, metrics skeleton | budoucí |
| LegalPage | version, effectiveFrom | page modules |
| Methodology | sections | page modules |

## Pravidla

- `status: "demo" | "draft"` musí být viditelné v UI
- Žádné garantované výnosy
- Zdroje citovat, pokud existují
- Slug: lowercase, bez diakritiky, pomlčky (`slugify` util)

## Přechod na CMS

Rozhraní zůstává; provider (lokální JSON → Sanity/Payload) se vymění za adaptérem `getContentBySlug(type, slug)`.
