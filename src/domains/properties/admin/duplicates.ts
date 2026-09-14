/**
 * Duplicate Review Center — list candidate pairs with evidence.
 */

import { prisma } from "@/lib/db";

export type DuplicateEvidence = {
  similarityScore: number;
  breakdown: {
    location?: number;
    area?: number;
    price?: number;
    text?: number;
    gpsMeters?: number | null;
  } | null;
  priceA: number | null;
  priceB: number | null;
  currencyA: string;
  currencyB: string;
  mediaCountA: number;
  mediaCountB: number;
  latA: number | null;
  lonA: number | null;
  latB: number | null;
  lonB: number | null;
};

export type DuplicateCandidateListItem = {
  id: string;
  status: string;
  similarityScore: number;
  notes: string | null;
  createdAt: Date;
  propertyA: {
    id: string;
    slug: string;
    title: string;
    status: string;
    marketCode: string;
    publicCity: string | null;
  };
  propertyB: {
    id: string;
    slug: string;
    title: string;
    status: string;
    marketCode: string;
    publicCity: string | null;
  };
  evidence: DuplicateEvidence;
};

function asBreakdown(
  raw: unknown,
): DuplicateEvidence["breakdown"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    location: typeof o.location === "number" ? o.location : undefined,
    area: typeof o.area === "number" ? o.area : undefined,
    price: typeof o.price === "number" ? o.price : undefined,
    text: typeof o.text === "number" ? o.text : undefined,
    gpsMeters: typeof o.gpsMeters === "number" ? o.gpsMeters : null,
  };
}

export async function listDuplicateCandidates(input?: {
  status?: string;
  take?: number;
}): Promise<{ items: DuplicateCandidateListItem[]; error: string | null }> {
  try {
    const status = input?.status ?? "PENDING";
    const take = Math.min(input?.take ?? 40, 100);

    const rows = await prisma.propertyDuplicateCandidate.findMany({
      where: { status: status as never },
      orderBy: [{ similarityScore: "desc" }, { createdAt: "desc" }],
      take,
      include: {
        propertyA: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            marketCode: true,
            publicCity: true,
            askingPrice: true,
            currency: true,
            latitude: true,
            longitude: true,
            _count: { select: { media: true } },
          },
        },
        propertyB: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            marketCode: true,
            publicCity: true,
            askingPrice: true,
            currency: true,
            latitude: true,
            longitude: true,
            _count: { select: { media: true } },
          },
        },
      },
    });

    const items: DuplicateCandidateListItem[] = rows.map((r) => ({
      id: r.id,
      status: r.status,
      similarityScore: r.similarityScore,
      notes: r.notes,
      createdAt: r.createdAt,
      propertyA: {
        id: r.propertyA.id,
        slug: r.propertyA.slug,
        title: r.propertyA.title,
        status: r.propertyA.status,
        marketCode: r.propertyA.marketCode,
        publicCity: r.propertyA.publicCity,
      },
      propertyB: {
        id: r.propertyB.id,
        slug: r.propertyB.slug,
        title: r.propertyB.title,
        status: r.propertyB.status,
        marketCode: r.propertyB.marketCode,
        publicCity: r.propertyB.publicCity,
      },
      evidence: {
        similarityScore: r.similarityScore,
        breakdown: asBreakdown(r.scoreBreakdown),
        priceA: r.propertyA.askingPrice,
        priceB: r.propertyB.askingPrice,
        currencyA: r.propertyA.currency,
        currencyB: r.propertyB.currency,
        mediaCountA: r.propertyA._count.media,
        mediaCountB: r.propertyB._count.media,
        latA: r.propertyA.latitude,
        lonA: r.propertyA.longitude,
        latB: r.propertyB.latitude,
        lonB: r.propertyB.longitude,
      },
    }));

    return { items, error: null };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Duplicate list failed",
    };
  }
}
