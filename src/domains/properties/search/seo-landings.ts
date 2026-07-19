/**
 * SEO landing pages for discovery (Prompt 8 Part 5).
 * Only these path landings are indexable; filtered query URLs are noindex.
 */

export type SeoLanding = {
  /** URL segment under /nemovitosti/ */
  slug: string;
  title: string;
  description: string;
  /** Default URL filter seed (city / region). */
  lokalita: string;
  h1: string;
};

/** Top category landings — keep short; do not auto-index every filter combo. */
export const PROPERTY_SEO_LANDINGS: readonly SeoLanding[] = [
  {
    slug: "praha",
    title: "Nemovitosti Praha",
    description:
      "Přehled demonstračních nabídek v Praze. Filtry a personalizace podle Finančního pasu.",
    lokalita: "Praha",
    h1: "Nemovitosti v Praze",
  },
  {
    slug: "brno",
    title: "Nemovitosti Brno",
    description:
      "Přehled demonstračních nabídek v Brně. Transparentní filtry a investiční metriky Majetio.",
    lokalita: "Brno",
    h1: "Nemovitosti v Brně",
  },
  {
    slug: "ostrava",
    title: "Nemovitosti Ostrava",
    description:
      "Přehled demonstračních nabídek v Ostravě. Katalog s URL filtry a doporučením podle profilu.",
    lokalita: "Ostrava",
    h1: "Nemovitosti v Ostravě",
  },
] as const;

export function getSeoLanding(slug: string): SeoLanding | undefined {
  return PROPERTY_SEO_LANDINGS.find((l) => l.slug === slug);
}

export function isSeoLandingSlug(slug: string): boolean {
  return PROPERTY_SEO_LANDINGS.some((l) => l.slug === slug);
}

/**
 * Filtered discovery URLs must not be indexed.
 * Clean /nemovitosti and SEO landings stay indexable.
 */
export function shouldNoIndexPropertySearch(state: {
  filterCount: number;
  page?: number;
}): boolean {
  if ((state.page ?? 1) > 1) return true;
  return state.filterCount > 0;
}
