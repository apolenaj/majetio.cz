/**
 * Programmatic SEO rules (Prompt 17.5).
 * Index only real data + market coverage — never mass-generate thin pages.
 * Legal/financial content expires via reviewRequiredAt + stale warnings.
 */

import { marketHasMinimumSeoDataCoverage } from "@/domains/markets/data-sources/registry";
import {
  marketRegistry,
  isMarketPubliclyActive,
} from "@/domains/markets/registry/market-registry";

export const PROGRAMMATIC_PAGE_KINDS = [
  "LOCATION_LANDING",
  "CITY_PROPERTY_LANDING",
  "COUNTRY_MARKET_LANDING",
  "LEGAL_DOC",
  "FINANCIAL_METHODOLOGY",
  "GUIDE_ARTICLE",
] as const;

export type ProgrammaticPageKind = (typeof PROGRAMMATIC_PAGE_KINDS)[number];

export type ProgrammaticSeoPage = {
  id: string;
  kind: ProgrammaticPageKind;
  marketCode: string;
  path: string;
  hasRealData: boolean;
  sampleCount: number | null;
  publishedAt: string | null;
  /** Legal & financial content must set this. */
  reviewRequiredAt: string | null;
  lastReviewedAt: string | null;
  isDemo: boolean;
};

export type ProgrammaticIndexDecision = {
  indexable: boolean;
  reasons: string[];
  staleContent: boolean;
  staleWarningEn: string | null;
};

const MIN_SAMPLE_FOR_LOCATION = 20;
const STALE_LEGAL_DAYS = 180;

function daysBetween(isoA: string, isoB: string): number {
  const a = Date.parse(isoA);
  const b = Date.parse(isoB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.abs(a - b) / (1000 * 60 * 60 * 24);
}

export function isContentStale(input: {
  reviewRequiredAt: string | null;
  lastReviewedAt: string | null;
  asOfIso?: string;
  /** When true, missing review dates count as stale. */
  requireReviewSchedule?: boolean;
}): boolean {
  const asOf = input.asOfIso ?? new Date().toISOString();
  if (input.reviewRequiredAt && input.reviewRequiredAt <= asOf) return true;
  if (input.lastReviewedAt) {
    return daysBetween(input.lastReviewedAt, asOf) > STALE_LEGAL_DAYS;
  }
  return Boolean(input.requireReviewSchedule);
}

/**
 * Gate programmatic pages — thin / demo / unpublished / non-public markets → noindex.
 */
export function decideProgrammaticIndexability(
  page: ProgrammaticSeoPage,
  asOfIso?: string,
): ProgrammaticIndexDecision {
  const reasons: string[] = [];
  const asOf = asOfIso ?? new Date().toISOString();
  const legalLike =
    page.kind === "LEGAL_DOC" || page.kind === "FINANCIAL_METHODOLOGY";

  if (page.isDemo) reasons.push("demo_content");
  if (!page.publishedAt) reasons.push("unpublished");
  if (!page.hasRealData) reasons.push("no_real_data");

  const market = marketRegistry.get(page.marketCode);
  if (!market || !isMarketPubliclyActive(market)) {
    reasons.push("market_not_public");
  }
  if (!marketHasMinimumSeoDataCoverage(page.marketCode)) {
    reasons.push("insufficient_data_source_coverage");
  }

  if (
    page.kind === "LOCATION_LANDING" ||
    page.kind === "CITY_PROPERTY_LANDING"
  ) {
    if ((page.sampleCount ?? 0) < MIN_SAMPLE_FOR_LOCATION) {
      reasons.push(`sample_below_${MIN_SAMPLE_FOR_LOCATION}`);
    }
  }

  let staleContent = false;
  let staleWarningEn: string | null = null;

  if (legalLike) {
    if (!page.reviewRequiredAt) {
      reasons.push("missing_reviewRequiredAt");
      staleContent = true;
      staleWarningEn =
        "Legal/financial page missing reviewRequiredAt — treat as stale until reviewed.";
    } else if (
      isContentStale({
        reviewRequiredAt: page.reviewRequiredAt,
        lastReviewedAt: page.lastReviewedAt,
        asOfIso: asOf,
        requireReviewSchedule: true,
      })
    ) {
      staleContent = true;
      staleWarningEn =
        "Content review is overdue. Do not present as current legal or financial advice.";
      reasons.push("stale_legal_or_financial_content");
    }
  }

  return {
    indexable: reasons.length === 0,
    reasons,
    staleContent,
    staleWarningEn,
  };
}

/** next review = lastReviewed + 180d */
export function computeReviewRequiredAt(lastReviewedAtIso: string): string {
  const d = new Date(lastReviewedAtIso);
  d.setUTCDate(d.getUTCDate() + STALE_LEGAL_DAYS);
  return d.toISOString();
}
