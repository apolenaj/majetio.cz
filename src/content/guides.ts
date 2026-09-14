import type { ContentBase } from "@/content/types";

export const GUIDE_CATEGORIES = [
  { slug: "koupe", title: "Koupě nemovitosti" },
  { slug: "investovani", title: "Investování" },
  { slug: "financovani", title: "Financování" },
  { slug: "rekonstrukce", title: "Rekonstrukce" },
  { slug: "pronajem", title: "Pronájem" },
  { slug: "dane-a-pravo", title: "Daně a právo" },
  { slug: "lokality", title: "Lokality" },
  { slug: "slovnik", title: "Slovník pojmů" },
] as const;

export type GuideArticle = ContentBase & {
  readingMinutes: number;
  categorySlug: (typeof GUIDE_CATEGORIES)[number]["slug"];
};

/** Small set of draft/demo articles — not mass-generated SEO filler. */
export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    id: "guide-co-je-majetio-skore",
    slug: "co-je-majetio-skore",
    title: "Co je Majetio skóre",
    perex: "Jak číst orientační skóre a proč není zárukou výnosu.",
    status: "demo",
    categorySlug: "investovani",
    readingMinutes: 4,
    author: { name: "Majetio", role: "redakce" },
    publishedAt: "2026-07-01",
    updatedAt: "2026-07-01",
    body: "Majetio skóre shrnuje více signálů do jednoho orientačního čísla. Není investičním doporučením.",
    cta: { label: "Zobrazit metodiku skóre", href: "/majetio-skore" },
  },
  {
    id: "guide-odhad-vs-cena",
    slug: "odhad-hodnoty-vs-nabidkova-cena",
    title: "Odhad hodnoty vs. nabídková cena",
    perex: "Proč se čísla liší a jak s tím pracovat při rozhodování.",
    status: "demo",
    categorySlug: "koupe",
    readingMinutes: 5,
    author: { name: "Majetio", role: "redakce" },
    publishedAt: "2026-07-01",
    body: "Nabídková cena je to, co prodávající chce. Odhad je model. Rozdíl je signál, ne verdikt.",
    cta: { label: "Jak odhadujeme hodnotu", href: "/metodika/odhad-hodnoty" },
  },
  {
    id: "guide-hypotekajasne",
    slug: "financovani-a-hypotekajasne",
    title: "Financování a HypotekaJasne",
    perex: "Co řeší Majetio orientačně a co patří do hypotečního produktu.",
    status: "demo",
    categorySlug: "financovani",
    readingMinutes: 3,
    author: { name: "Majetio", role: "redakce" },
    publishedAt: "2026-07-01",
    body: "Majetio neposkytuje hypoteční porovnání jako produkt. K tomu slouží HypotekaJasne.cz.",
    cta: { label: "Kalkulačka financování", href: "/kalkulacky/financovani" },
  },
];

export function getGuideBySlug(slug: string) {
  return GUIDE_ARTICLES.find((a) => a.slug === slug);
}
