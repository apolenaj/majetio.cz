/**
 * Batch-load comparison modules without N+1 (BOD 144, 145).
 * One query per module type, then group in memory.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { comparisonConfig } from "@/config/comparison";

const propertySelect = {
  id: true,
  slug: true,
  title: true,
  status: true,
  visibility: true,
  isDemo: true,
  askingPrice: true,
  originalAskingPrice: true,
  priceCzk: true,
  pricePerSqm: true,
  usableArea: true,
  layout: true,
  propertyType: true,
  condition: true,
  publicCity: true,
  publicDistrict: true,
  publicLabel: true,
  publishedAt: true,
  updatedAt: true,
  locationId: true,
  media: {
    where: { isPlaceholder: false },
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    take: 1,
    select: { url: true, isPrimary: true },
  },
} satisfies Prisma.PropertySelect;

export type ComparisonPropertyRow = Prisma.PropertyGetPayload<{
  select: typeof propertySelect;
}>;

export type ComparisonModuleBundle = {
  properties: ComparisonPropertyRow[];
  valuationsByProperty: Map<
    string,
    {
      estimatedValue: number | null;
      lowerBound: number | null;
      upperBound: number | null;
      confidenceScore: number | null;
      confidenceLevel: string;
      calculatedAt: Date | null;
    }
  >;
  renovationsByProperty: Map<
    string,
    {
      estimatedLow: number | null;
      estimatedBase: number | null;
      estimatedHigh: number | null;
      estimatedDuration: number | null;
      confidence: number | null;
      calculatedAt: Date | null;
    }
  >;
  investmentsByProperty: Map<
    string,
    {
      outputs: unknown;
      createdAt: Date;
    }
  >;
  analysesByProperty: Map<
    string,
    { majetioScore: number | null; updatedAt: Date }
  >;
  priceDropsByProperty: Map<string, number>;
  favouritesByProperty: Map<string, string>;
};

function pickLatestByProperty<T extends { propertyId: string | null }>(
  rows: T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (!row.propertyId) continue;
    if (!map.has(row.propertyId)) map.set(row.propertyId, row);
  }
  return map;
}

/**
 * Parallel module fetch for up to maxProperties ids — no per-property round trips.
 */
export async function loadComparisonModuleBundle(input: {
  propertyIds: string[];
  userId?: string | null;
}): Promise<ComparisonModuleBundle> {
  const ids = [...new Set(input.propertyIds)].slice(
    0,
    comparisonConfig.maxProperties,
  );
  if (ids.length === 0) {
    return {
      properties: [],
      valuationsByProperty: new Map(),
      renovationsByProperty: new Map(),
      investmentsByProperty: new Map(),
      analysesByProperty: new Map(),
      priceDropsByProperty: new Map(),
      favouritesByProperty: new Map(),
    };
  }

  const [
    properties,
    valuations,
    renovations,
    investments,
    analyses,
    priceHistory,
    favourites,
  ] = await Promise.all([
    prisma.property.findMany({
      where: { id: { in: ids } },
      select: propertySelect,
    }),
    prisma.valuation.findMany({
      where: {
        propertyId: { in: ids },
        status: { in: ["CALCULATED", "APPROVED"] },
      },
      orderBy: { calculatedAt: "desc" },
      select: {
        propertyId: true,
        estimatedValue: true,
        lowerBound: true,
        upperBound: true,
        confidenceScore: true,
        confidenceLevel: true,
        calculatedAt: true,
      },
    }),
    prisma.renovationAnalysis.findMany({
      where: {
        propertyId: { in: ids },
        status: { in: ["CALCULATED", "PARTIAL"] },
      },
      orderBy: [{ calculatedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        propertyId: true,
        estimatedLow: true,
        estimatedBase: true,
        estimatedHigh: true,
        estimatedDuration: true,
        confidence: true,
        calculatedAt: true,
      },
    }),
    prisma.investmentCalculation.findMany({
      where: { propertyId: { in: ids } },
      orderBy: { createdAt: "desc" },
      select: {
        propertyId: true,
        outputs: true,
        createdAt: true,
      },
    }),
    prisma.propertyAnalysis.findMany({
      where: { propertyId: { in: ids } },
      orderBy: { updatedAt: "desc" },
      select: {
        propertyId: true,
        majetioScore: true,
        updatedAt: true,
      },
    }),
    prisma.propertyPriceHistory.findMany({
      where: {
        propertyId: { in: ids },
        changeType: "DECREASED",
      },
      orderBy: { observedAt: "desc" },
      select: {
        propertyId: true,
        amount: true,
        priceCzk: true,
        observedAt: true,
        changeType: true,
      },
      take: ids.length * 3,
    }),
    input.userId
      ? prisma.favourite.findMany({
          where: {
            userId: input.userId,
            propertyId: { in: ids },
            archivedAt: null,
          },
          select: { propertyId: true, status: true },
        })
      : Promise.resolve([] as Array<{ propertyId: string; status: string }>),
  ]);

  // Preserve caller order
  const byId = new Map(properties.map((p) => [p.id, p]));
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((p): p is ComparisonPropertyRow => p != null);

  const valMap = new Map<
    string,
    ComparisonModuleBundle["valuationsByProperty"] extends Map<string, infer V>
      ? V
      : never
  >();
  for (const v of valuations) {
    if (!valMap.has(v.propertyId)) {
      valMap.set(v.propertyId, {
        estimatedValue: v.estimatedValue,
        lowerBound: v.lowerBound,
        upperBound: v.upperBound,
        confidenceScore: v.confidenceScore,
        confidenceLevel: v.confidenceLevel,
        calculatedAt: v.calculatedAt,
      });
    }
  }

  const renoLatest = pickLatestByProperty(renovations);
  const renoMap = new Map<
    string,
    {
      estimatedLow: number | null;
      estimatedBase: number | null;
      estimatedHigh: number | null;
      estimatedDuration: number | null;
      confidence: number | null;
      calculatedAt: Date | null;
    }
  >();
  for (const [pid, r] of renoLatest) {
    renoMap.set(pid, {
      estimatedLow: r.estimatedLow,
      estimatedBase: r.estimatedBase,
      estimatedHigh: r.estimatedHigh,
      estimatedDuration: r.estimatedDuration,
      confidence: r.confidence,
      calculatedAt: r.calculatedAt,
    });
  }

  const invLatest = pickLatestByProperty(investments);
  const invMap = new Map<string, { outputs: unknown; createdAt: Date }>();
  for (const [pid, row] of invLatest) {
    invMap.set(pid, { outputs: row.outputs, createdAt: row.createdAt });
  }

  const analysisLatest = pickLatestByProperty(analyses);
  const analysisMap = new Map<
    string,
    { majetioScore: number | null; updatedAt: Date }
  >();
  for (const [pid, row] of analysisLatest) {
    analysisMap.set(pid, {
      majetioScore: row.majetioScore,
      updatedAt: row.updatedAt,
    });
  }

  // Recent drop = difference between latest decreased observation and prior ask
  const priceDrops = new Map<string, number>();
  const seenDrop = new Set<string>();
  for (const h of priceHistory) {
    if (seenDrop.has(h.propertyId)) continue;
    seenDrop.add(h.propertyId);
    const prop = byId.get(h.propertyId);
    const current = prop?.askingPrice ?? prop?.priceCzk ?? null;
    const previous = h.amount ?? h.priceCzk;
    if (current != null && previous != null && previous > current) {
      priceDrops.set(h.propertyId, previous - current);
    }
  }

  const favMap = new Map<string, string>();
  for (const f of favourites) {
    favMap.set(f.propertyId, f.status);
  }

  return {
    properties: ordered,
    valuationsByProperty: valMap,
    renovationsByProperty: renoMap,
    investmentsByProperty: invMap,
    analysesByProperty: analysisMap,
    priceDropsByProperty: priceDrops,
    favouritesByProperty: favMap,
  };
}
