/**
 * Pricing page presentation — merge DB PricingPlan with architecture + flags.
 */

import {
  pricingCatalog,
  pricingSegments,
  type CatalogProductDef,
  type PricingSegmentId,
} from "@/config/pricing-architecture";
import {
  isFeatureEnabled,
  type FeatureFlagKey,
} from "@/config/feature-flags";
import { formatCzkFromMinor } from "@/config/commerce";
import type { PublicPricingPlan } from "@/domains/commerce/catalog";
import { isCatalogProductPubliclyListed } from "@/domains/commerce/product-availability";

export type PricingCardViewModel = {
  key: string;
  nameCs: string;
  taglineCs: string;
  priceLabelCs: string;
  priceGrossMinor: number | null;
  billingLabelCs: string;
  features: string[];
  limits: Array<{ label: string; value: string }>;
  ctaHref: string | null;
  ctaLabelCs: string;
  disabledReasonCs: string | null;
  comparisonHighlight: boolean;
  requiresRenewConsent: boolean;
  versionKey: string | null;
};

const SEGMENT_ORDER: PricingSegmentId[] = [
  "buyers",
  "investors",
  "sellers",
  "agents",
  "developers",
  "professional_services",
];

function billingLabel(def: CatalogProductDef): string {
  switch (def.billingType) {
    case "ONE_TIME":
      return def.priceGrossMinor === 0 ? "Zdarma" : "Jednorázově";
    case "SUBSCRIPTION":
      return def.requiresRenewConsent
        ? "Předplatné · obnova jen se souhlasem"
        : "Předplatné";
    case "USAGE":
      return "Podle využití";
    case "CONTACT":
      return "Individuálně";
    default:
      return "";
  }
}

function formatLimitValue(value: number | string | boolean | null): string {
  if (value === null) return "Neomezeno";
  if (typeof value === "boolean") return value ? "Ano" : "Ne";
  return String(value);
}

function resolveLivePrice(
  def: CatalogProductDef,
  livePlans: PublicPricingPlan[],
): { priceGrossMinor: number | null; versionKey: string | null } {
  const live = livePlans.find((p) => p.key === def.key);
  if (live) {
    return {
      priceGrossMinor: live.priceGrossMinor,
      versionKey: live.versionKey,
    };
  }
  return { priceGrossMinor: def.priceGrossMinor, versionKey: null };
}

function isProductEnabled(def: CatalogProductDef): boolean {
  if (!def.featureFlag) return true;
  return isFeatureEnabled(def.featureFlag as FeatureFlagKey);
}

export function buildPricingPageModel(livePlans: PublicPricingPlan[]): {
  segments: Array<{
    id: PricingSegmentId;
    titleCs: string;
    introCs: string;
    audience: "b2c" | "b2b" | "services";
    cards: PricingCardViewModel[];
  }>;
  comparisonRows: Array<{
    key: string;
    nameCs: string;
    segmentTitleCs: string;
    priceLabelCs: string;
    limits: string;
    features: string;
  }>;
} {
  const segments = SEGMENT_ORDER.map((id) => {
    const meta = pricingSegments[id];
    const cards = pricingCatalog
      .filter((p) => p.segment === id)
      .filter((p) => isCatalogProductPubliclyListed(p))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((def) => {
        const enabled = isProductEnabled(def);
        const { priceGrossMinor, versionKey } = resolveLivePrice(def, livePlans);
        const priceLabelCs =
          priceGrossMinor == null
            ? "Na vyžádání"
            : priceGrossMinor === 0
              ? "Zdarma"
              : formatCzkFromMinor(priceGrossMinor);

        let ctaHref: string | null = null;
        let ctaLabelCs = "Objednat";
        let disabledReasonCs: string | null = null;

        if (!enabled) {
          disabledReasonCs =
            def.key === "purchase_concierge"
              ? "Dostupné až po právním rámci (feature flag OFF)."
              : "Produkt není v této fázi spuštěný.";
          ctaHref = null;
          ctaLabelCs = "Nedostupné";
        } else if (def.billingType === "CONTACT" || priceGrossMinor == null) {
          ctaHref = "/kontakt";
          ctaLabelCs = "Domluvit konzultaci";
        } else if (priceGrossMinor === 0) {
          ctaHref =
            def.segment === "agents" || def.segment === "developers"
              ? "/kontakt"
              : "/analyza";
          ctaLabelCs = "Začít zdarma";
        } else {
          ctaHref = `/checkout?product=${encodeURIComponent(def.key)}`;
          ctaLabelCs = "Objednat";
        }

        return {
          key: def.key,
          nameCs: def.nameCs,
          taglineCs: def.taglineCs,
          priceLabelCs,
          priceGrossMinor,
          billingLabelCs: billingLabel(def),
          features: def.features,
          limits: Object.entries(def.limits).map(([label, value]) => ({
            label,
            value: formatLimitValue(value),
          })),
          ctaHref,
          ctaLabelCs,
          disabledReasonCs,
          comparisonHighlight: Boolean(def.comparisonHighlight),
          requiresRenewConsent: def.requiresRenewConsent,
          versionKey,
        } satisfies PricingCardViewModel;
      });

    return {
      id,
      titleCs: meta.titleCs,
      introCs: meta.introCs,
      audience: meta.audience,
      cards,
    };
  });

  const comparisonRows = pricingCatalog
    .filter((p) => isCatalogProductPubliclyListed(p))
    .filter((p) => p.comparisonHighlight || p.priceGrossMinor === 0)
    .slice(0, 12)
    .map((def) => {
      const { priceGrossMinor } = resolveLivePrice(def, livePlans);
      return {
        key: def.key,
        nameCs: def.nameCs,
        segmentTitleCs: pricingSegments[def.segment].titleCs,
        priceLabelCs:
          priceGrossMinor == null
            ? "Individuálně"
            : priceGrossMinor === 0
              ? "Zdarma"
              : formatCzkFromMinor(priceGrossMinor),
        limits: Object.entries(def.limits)
          .slice(0, 3)
          .map(([k, v]) => `${k}: ${formatLimitValue(v)}`)
          .join(" · "),
        features: def.features.slice(0, 3).join(", "),
      };
    });

  return { segments, comparisonRows };
}
