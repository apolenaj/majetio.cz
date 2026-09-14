/**
 * Admin property list query — filters for market, status, DQ, stale, valuation.
 */

import type { Prisma, PropertyStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export type AdminPropertyListFilters = {
  q?: string;
  marketCode?: string;
  status?: PropertyStatus | string;
  freshness?: string;
  visibility?: string;
  hasCriticalDq?: boolean;
  isDemo?: boolean;
  take?: number;
  skip?: number;
};

export type AdminPropertyListItem = {
  id: string;
  slug: string;
  title: string;
  status: string;
  visibility: string;
  freshness: string;
  marketCode: string;
  askingPrice: number | null;
  currency: string;
  publicCity: string | null;
  isDemo: boolean;
  updatedAt: Date;
  criticalDqCount: number;
  hasValuation: boolean;
};

export async function listAdminProperties(
  filters: AdminPropertyListFilters = {},
): Promise<{ items: AdminPropertyListItem[]; total: number; error: string | null }> {
  const take = Math.min(filters.take ?? 40, 100);
  const skip = filters.skip ?? 0;

  try {
    const where: Prisma.PropertyWhereInput = {};

    if (filters.marketCode) {
      where.marketCode = filters.marketCode.toUpperCase();
    }
    if (filters.status) {
      where.status = filters.status as PropertyStatus;
    }
    if (filters.freshness) {
      where.freshness = filters.freshness as never;
    }
    if (filters.visibility) {
      where.visibility = filters.visibility as never;
    }
    if (filters.isDemo != null) {
      where.isDemo = filters.isDemo;
    }
    if (filters.q?.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { publicCity: { contains: q, mode: "insensitive" } },
        { id: { equals: q } },
      ];
    }
    if (filters.hasCriticalDq) {
      where.qualityIssues = {
        some: { severity: "CRITICAL", status: "OPEN" },
      };
    }

    const [rows, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          visibility: true,
          freshness: true,
          marketCode: true,
          askingPrice: true,
          currency: true,
          publicCity: true,
          isDemo: true,
          updatedAt: true,
          _count: {
            select: {
              qualityIssues: {
                where: { severity: "CRITICAL", status: "OPEN" },
              },
              valuations: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    const items: AdminPropertyListItem[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      status: r.status,
      visibility: r.visibility,
      freshness: r.freshness,
      marketCode: r.marketCode,
      askingPrice: r.askingPrice,
      currency: r.currency,
      publicCity: r.publicCity,
      isDemo: r.isDemo,
      updatedAt: r.updatedAt,
      criticalDqCount: r._count.qualityIssues,
      hasValuation: r._count.valuations > 0,
    }));

    return { items, total, error: null };
  } catch (err) {
    return {
      items: [],
      total: 0,
      error: err instanceof Error ? err.message : "List failed",
    };
  }
}

export async function listModerationQueue(input?: {
  take?: number;
}): Promise<{
  items: AdminPropertyListItem[];
  error: string | null;
}> {
  const result = await listAdminProperties({
    status: "PENDING_REVIEW",
    take: input?.take ?? 50,
    isDemo: false,
  });
  return { items: result.items, error: result.error };
}
