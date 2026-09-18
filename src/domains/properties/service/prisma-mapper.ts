/**
 * Map Prisma Property (+ media) → PropertyRecord for PropertyService.
 */

import type { Property, PropertyMedia, Prisma } from "@prisma/client";

import type { PropertyRecord } from "@/domains/properties/service/dto";

export type PrismaPropertyWithMedia = Property & {
  media?: PropertyMedia[];
  completeness?: { score: number } | null;
  investmentSnapshot?: {
    grossYieldPct: number | null;
    netYieldPct: number | null;
    estimatedRentMonthlyCzk: number | null;
    monthlyCashflowCzk: number | null;
    renovationCostMinCzk: number | null;
    renovationCostMaxCzk: number | null;
    tenantDemandScore: number | null;
    estimatedOccupancyMinPct: number | null;
    estimatedOccupancyMaxPct: number | null;
    majetioScore: number | null;
    calculatedAt: Date | null;
  } | null;
};

export function mapPrismaPropertyToRecord(
  row: PrismaPropertyWithMedia,
): PropertyRecord {
  const media = (row.media ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || Number(b.isPrimary) - Number(a.isPrimary))
    .map((m) => ({
      url: m.url,
      type: m.type,
      isPrimary: m.isPrimary,
      isPlaceholder: m.isPlaceholder,
      alt: m.alt,
      licenseStatus: m.licenseStatus,
      sourceId: m.sourceId,
    }));

  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    visibility: row.visibility,
    transactionType: row.transactionType,
    title: row.title,
    description: row.description,
    propertyType: row.propertyType,
    askingPrice: row.askingPrice,
    priceCzk: row.priceCzk,
    currency: row.currency,
    marketCode: row.marketCode,
    pricePerSqm: row.pricePerSqm,
    usableArea: row.usableArea,
    floorArea: row.floorArea,
    areaSqm: row.areaSqm,
    layout: row.layout,
    disposition: row.disposition,
    condition: row.condition,
    ownershipType: row.ownershipType,
    energyRating: row.energyRating === "UNKNOWN" ? null : row.energyRating,
    floor: row.floor,
    floorsTotal: row.floorsTotal,
    hasElevator: row.hasElevator,
    publicLabel: row.publicLabel,
    addressPrecision: row.addressPrecision,
    publicCity: row.publicCity,
    publicDistrict: row.publicDistrict,
    publicRegion: row.publicRegion,
    street: row.street,
    houseNumber: row.houseNumber,
    orientationNumber: row.orientationNumber,
    zip: row.zip,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    lastSeenAt: row.lastSeenAt,
    freshness: row.freshness,
    isDemo: row.isDemo,
    ownerUserId: row.ownerUserId,
    completenessScore: row.completeness?.score ?? null,
    canonicalKey: row.canonicalKey,
    grossYieldPct: row.investmentSnapshot?.grossYieldPct ?? null,
    netYieldPct: row.investmentSnapshot?.netYieldPct ?? null,
    cashFlowMonthlyCzk: row.investmentSnapshot?.monthlyCashflowCzk ?? null,
    estimatedRentMonthlyCzk: row.investmentSnapshot?.estimatedRentMonthlyCzk ?? null,
    renovationCostMinCzk: row.investmentSnapshot?.renovationCostMinCzk ?? null,
    renovationCostMaxCzk: row.investmentSnapshot?.renovationCostMaxCzk ?? null,
    tenantDemandScore: row.investmentSnapshot?.tenantDemandScore ?? null,
    estimatedOccupancyMinPct: row.investmentSnapshot?.estimatedOccupancyMinPct ?? null,
    estimatedOccupancyMaxPct: row.investmentSnapshot?.estimatedOccupancyMaxPct ?? null,
    majetioScore: row.investmentSnapshot?.majetioScore ?? null,
    hasInvestmentSnapshot: row.investmentSnapshot?.calculatedAt != null,
    media,
  };
}

export const propertyDetailInclude = {
  media: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
  completeness: true,
} satisfies Prisma.PropertyInclude;

/** Public discovery eligibility — real listings + optional demos. */
export function publicDiscoveryWhere(options?: {
  includeDemo?: boolean;
}): Prisma.PropertyWhereInput {
  const base: Prisma.PropertyWhereInput = {
    status: "ACTIVE",
    visibility: "PUBLIC",
    listingModerationStatus: { not: "BANNED" },
    listingQuotaState: "WITHIN_LIMIT",
  };
  if (options?.includeDemo === false) {
    return { ...base, isDemo: false };
  }
  return base;
}
