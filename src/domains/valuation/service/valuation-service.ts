/**
 * ValuationService — secure DTO projection over the math engine (Prompt 10 Part 4).
 * Public viewers never receive internal weights / full comparable identity when licensed out.
 */

import {
  getDemoComparableMeta,
  listDemoValuationCandidates,
} from "@/content/demo-valuation-comparables";
import { getDemoPropertyRecord } from "@/content/demo-canonical-properties";
import { isDemoPropertyContentAllowed } from "@/lib/demo-content-gate";
import type { PublicPropertyDto } from "@/domains/properties/service/dto";
import type { PropertyRecord } from "@/domains/properties/service/dto";
import {
  VALUATION_LEGAL_DISCLAIMER,
  type AnalystComparableDto,
  type AnalystValuationDto,
  type PublicComparableDto,
  type PublicValuationAdjustmentDto,
  type PublicValuationDto,
  type ValuationDto,
} from "../dto";
import { RESIDENTIAL_APARTMENT_V1 } from "../types";
import { runValuationEstimate } from "./index";
import type {
  ComparableCandidate,
  FeatureAdjustment,
  ScoredComparable,
  ValuationEstimateResult,
  ValuationSubject,
} from "./types";

export type ValuationViewer = {
  userId?: string | null;
  role?: string | null;
};

export type ValuationServiceDeps = {
  getCandidates?: (subject: ValuationSubject) => ComparableCandidate[];
  asOf?: Date;
};

function isAnalystViewer(viewer: ValuationViewer): boolean {
  const role = (viewer.role ?? "PUBLIC").toUpperCase();
  return (
    role === "STAFF" ||
    role === "ADMIN" ||
    role === "ANALYST" ||
    role === "SUPER_ADMIN" ||
    role === "EDITOR" ||
    role === "SALES"
  );
}

/** Map public DTO / record → engine subject. */
export function toValuationSubject(
  property: Pick<
    PublicPropertyDto,
    | "id"
    | "propertyType"
    | "usableArea"
    | "layout"
    | "condition"
    | "floor"
    | "floorsTotal"
    | "hasElevator"
    | "location"
    | "slug"
  > & { hasBalcony?: boolean | null },
  extras?: { hasBalcony?: boolean | null },
): ValuationSubject {
  const record = isDemoPropertyContentAllowed()
    ? getDemoPropertyRecord(
        "slug" in property
          ? String((property as { slug?: string }).slug ?? "")
          : "",
      )
    : null;
  const hasBalcony =
    extras?.hasBalcony ??
    property.hasBalcony ??
    (record as PropertyRecord & { hasBalcony?: boolean | null })?.hasBalcony ??
    null;

  return {
    id: property.id,
    propertyType: property.propertyType,
    usableArea: property.usableArea,
    layout: property.layout,
    condition: property.condition,
    floor: property.floor,
    floorsTotal: property.floorsTotal,
    hasBalcony,
    hasElevator: property.hasElevator,
    city: property.location.city,
    district: property.location.district,
    region: property.location.region,
    latitude: property.location.latitude,
    longitude: property.location.longitude,
  };
}

export function adjustmentPublicLabel(
  adj: FeatureAdjustment,
): PublicValuationAdjustmentDto {
  const direction: PublicValuationAdjustmentDto["direction"] =
    adj.factor > 0 ? "up" : adj.factor < 0 ? "down" : "neutral";
  const verb =
    direction === "up" ? "zvyšuje" : direction === "down" ? "snižuje" : "neutrální";

  const labelByCode: Record<string, string> = {
    balcony: `Balkon: ${verb}`,
    ground_floor: `Přízemí: ${verb}`,
    high_floor_elevator: `Výtah / vyšší patro: ${verb}`,
    condition_better: `Stav: ${verb}`,
    condition_worse: `Stav: ${verb}`,
    no_elevator: `Bez výtahu: ${verb}`,
  };

  return {
    code: adj.code,
    label: labelByCode[adj.code] ?? `${adj.code}: ${verb}`,
    direction,
    factor: adj.factor,
    amountCzk: adj.amountCzk,
    reason: adj.reason,
  };
}

function roundPriceForPublic(czk: number): number {
  // Soft anonymization — round to nearest 50k
  return Math.round(czk / 50_000) * 50_000;
}

function monthStamp(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function toPublicComparable(
  scored: ScoredComparable,
  index: number,
): PublicComparableDto {
  const meta = getDemoComparableMeta(scored.candidate.id);
  const anonymize = meta?.publicLicense === "ANONYMIZE";
  const c = scored.candidate;

  if (anonymize) {
    return {
      id: `anon-${index + 1}`,
      label: `Srovnatelná nemovitost ${index + 1}`,
      anonymized: true,
      layout: c.layout,
      usableArea: c.usableArea,
      priceCzk: roundPriceForPublic(c.priceCzk),
      pricePerSqm:
        c.usableArea && c.usableArea > 0
          ? Math.round(roundPriceForPublic(c.priceCzk) / c.usableArea)
          : scored.pricePerSqm,
      city: c.city,
      district: c.district,
      similarityPct: Math.round(scored.similarityScore * 100),
      observedAt: monthStamp(c.observedAt),
    };
  }

  return {
    id: c.id,
    label: meta?.label ?? `Srovnatelná nemovitost ${index + 1}`,
    anonymized: false,
    layout: c.layout,
    usableArea: c.usableArea,
    priceCzk: c.priceCzk,
    pricePerSqm: scored.pricePerSqm,
    city: c.city,
    district: c.district,
    similarityPct: Math.round(scored.similarityScore * 100),
    observedAt: c.observedAt,
  };
}

function toAnalystComparable(
  scored: ScoredComparable,
  index: number,
): AnalystComparableDto {
  const pub = toPublicComparable(scored, index);
  const c = scored.candidate;
  return {
    ...pub,
    // Analyst always sees real identity even if public row is anonymized
    id: c.id,
    label: getDemoComparableMeta(c.id)?.label ?? pub.label,
    anonymized: pub.anonymized,
    internalId: c.id,
    weight: scored.weight,
    rawWeight: scored.rawWeight,
    geoTier: scored.geoTier,
    geoWeight: scored.geoWeight,
    timeDecayWeight: scored.timeDecayWeight,
    similarityScore: scored.similarityScore,
    included: scored.included,
    exclusionReason: scored.exclusionReason,
    latitude: c.latitude,
    longitude: c.longitude,
    distanceMeters: scored.distanceMeters,
    isTransaction: c.isTransaction === true,
    priceCzk: c.priceCzk,
    pricePerSqm: scored.pricePerSqm,
    observedAt: c.observedAt,
  };
}

function pickPublicComparables(
  result: ValuationEstimateResult,
): PublicComparableDto[] {
  const included = result.comparables
    .filter((c) => c.included && c.weight > 0)
    .sort((a, b) => b.weight - a.weight || b.similarityScore - a.similarityScore)
    .slice(0, 10);

  // Prefer 3–10; if fewer than 3 included, still return what we have
  return included.map((c, i) => toPublicComparable(c, i));
}

function mapEstimateToPublic(
  result: ValuationEstimateResult,
  opts: {
    askingPriceCzk: number | null;
    isDemo: boolean;
    calculatedAt: string;
  },
): PublicValuationDto {
  const mid = result.adjustedValueCzk;
  const asking = opts.askingPriceCzk;
  let askingVsMidPct: number | null = null;
  let askingVsMidCzk: number | null = null;
  if (asking != null && mid != null && mid > 0) {
    askingVsMidCzk = asking - mid;
    askingVsMidPct = Math.round(((asking - mid) / mid) * 1000) / 10;
  }

  return {
    kind: "public",
    status: result.status,
    statusReason: result.statusReason,
    estimateMidCzk: mid,
    lowerBoundCzk: result.lowerBoundCzk,
    upperBoundCzk: result.upperBoundCzk,
    confidenceLevel: result.confidenceLevel,
    confidenceExplanations: result.confidenceExplanations,
    askingPriceCzk: asking,
    askingVsMidPct,
    askingVsMidCzk,
    adjustments: result.adjustments.map(adjustmentPublicLabel),
    comparables: pickPublicComparables(result),
    engineVersion: result.engineVersion,
    isDemo: opts.isDemo,
    calculatedAt: opts.calculatedAt,
    disclaimer: VALUATION_LEGAL_DISCLAIMER,
  };
}

function mapEstimateToAnalyst(
  result: ValuationEstimateResult,
  subject: ValuationSubject,
  opts: {
    askingPriceCzk: number | null;
    isDemo: boolean;
    calculatedAt: string;
  },
): AnalystValuationDto {
  const pub = mapEstimateToPublic(result, opts);
  return {
    ...pub,
    kind: "analyst",
    confidenceScore: result.confidenceScore,
    baseValueCzk: result.base.baseValueCzk,
    pricePerSqmWeightedMedian: result.base.pricePerSqmWeightedMedian,
    relativeRangeWidth: result.relativeRangeWidth,
    modelCode: RESIDENTIAL_APARTMENT_V1.code,
    inputSnapshot: {
      modelCode: RESIDENTIAL_APARTMENT_V1.code,
      modelVersion: result.engineVersion,
      propertySnapshot: {
        propertyId: subject.id,
        propertyType: subject.propertyType,
        usableArea: subject.usableArea,
        layout: subject.layout,
        askingPrice: opts.askingPriceCzk,
        condition: subject.condition,
        city: subject.city,
        district: subject.district,
      },
      capturedAt: opts.calculatedAt,
    },
    analystComparables: result.comparables.map((c, i) =>
      toAnalystComparable(c, i),
    ),
  };
}

export function createValuationService(deps: ValuationServiceDeps = {}) {
  const getCandidates =
    deps.getCandidates ??
    (() =>
      isDemoPropertyContentAllowed() ? listDemoValuationCandidates() : []);

  function estimateForSubject(
    subject: ValuationSubject,
    options: {
      askingPriceCzk?: number | null;
      viewer?: ValuationViewer;
      isDemo?: boolean;
    } = {},
  ): ValuationDto {
    const asOf = deps.asOf ?? new Date();
    const calculatedAt = asOf.toISOString();
    const candidates = getCandidates(subject).filter((c) => c.id !== subject.id);
    const result = runValuationEstimate(subject, candidates, { asOf });
    const asking = options.askingPriceCzk ?? null;
    const isDemo = options.isDemo ?? false;
    const viewer = options.viewer ?? {};

    if (isAnalystViewer(viewer)) {
      return mapEstimateToAnalyst(result, subject, {
        askingPriceCzk: asking,
        isDemo,
        calculatedAt,
      });
    }
    return mapEstimateToPublic(result, {
      askingPriceCzk: asking,
      isDemo,
      calculatedAt,
    });
  }

  function estimateForProperty(
    property: PublicPropertyDto,
    viewer: ValuationViewer = {},
  ): ValuationDto {
    const subject = toValuationSubject(property);
    return estimateForSubject(subject, {
      askingPriceCzk: property.askingPrice,
      viewer,
      isDemo: property.isDemo,
    });
  }

  return {
    estimateForSubject,
    estimateForProperty,
    isAnalystViewer,
  };
}

/** Default singleton for app routes. */
export const valuationService = createValuationService();
