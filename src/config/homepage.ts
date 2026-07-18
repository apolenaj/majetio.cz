import { homepageContent } from "@/content/homepage";

/**
 * Homepage composition & experiment defaults.
 * Swap variants later via flag / edge config without rewriting section components.
 */

export type HomepageSectionId =
  | "sampleAnalysis"
  | "scoreAndMetrics"
  | "howItWorks"
  | "strategies"
  | "audiences"
  | "financing"
  | "renovationLocationRisks"
  | "comparison"
  | "pricing"
  | "methodology"
  | "faq"
  | "finalCta";

/** Control order — A/B can reorder via `resolveHomepageSectionOrder`. */
export const homepageSectionOrderControl: readonly HomepageSectionId[] = [
  "sampleAnalysis",
  "scoreAndMetrics",
  "howItWorks",
  "strategies",
  "audiences",
  "financing",
  "renovationLocationRisks",
  "comparison",
  "pricing",
  "methodology",
  "faq",
  "finalCta",
] as const;

export type HomepageExperimentId = "homepage_h1" | "homepage_primary_cta" | "homepage_section_order";

export type HomepageExperimentBucket = "control" | "challenger";

export const homepageExperimentDefaults: Record<HomepageExperimentId, HomepageExperimentBucket> =
  {
    homepage_h1: "control",
    homepage_primary_cta: "control",
    homepage_section_order: "control",
  };

/** Challenger copy reserved for future A/B — not active until flag flips. */
const challengerHero = {
  headline: "Vyplatí se tuto nemovitost koupit?",
  primaryCtaLabel: "Spustit analýzu",
} as const;

export function resolveHomepageHero(options?: {
  h1?: HomepageExperimentBucket;
  cta?: HomepageExperimentBucket;
}) {
  const h1 = options?.h1 ?? "control";
  const cta = options?.cta ?? "control";

  const headline =
    h1 === "challenger" ? challengerHero.headline : homepageContent.hero.headline;
  const primaryLabel =
    cta === "challenger"
      ? challengerHero.primaryCtaLabel
      : homepageContent.hero.primaryCta.label;

  return {
    ...homepageContent.hero,
    headline,
    primaryCta: {
      ...homepageContent.hero.primaryCta,
      label: primaryLabel,
    },
  };
}

export function resolveHomepageSectionOrder(
  bucket: HomepageExperimentBucket = "control",
): readonly HomepageSectionId[] {
  if (bucket === "challenger") {
    return [
      "sampleAnalysis",
      "howItWorks",
      "pricing",
      "scoreAndMetrics",
      "strategies",
      "audiences",
      "financing",
      "renovationLocationRisks",
      "comparison",
      "methodology",
      "faq",
      "finalCta",
    ];
  }
  return homepageSectionOrderControl;
}

export const homepageSeo = {
  title: "Zjistěte, zda se nemovitost skutečně vyplatí koupit | Majetio",
  description: homepageContent.hero.subheadline,
  canonicalPath: "/",
  ogImagePath: "/brand/social/majetio-og-brand.png",
  ogImageAlt: "Majetio — analytická realitní platforma",
} as const;
