/**
 * Listing analytics for Agency Dashboard (135 / 136).
 * Aggregate metrics only — no anonymous user PII without consent.
 */

import { prisma } from "@/lib/db";
import {
  assertOrganizationAccess,
  buildPropertyTenantWhere,
  type OrgAccessActor,
} from "@/domains/organizations/tenant";

export type ListingMetricRow = {
  propertyId: string;
  title: string | null;
  slug: string | null;
  impressions: number;
  saves: number;
  inquiries: number;
};

/** Increment counters — call sites must never pass user identifiers. */
export async function recordListingMetric(input: {
  propertyId: string;
  metric: "impressions" | "saves" | "inquiries";
  amount?: number;
  day?: Date;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { id: true, organizationId: true },
  });
  if (!property?.organizationId) {
    return { ok: false, error: "Nemovitost bez organizace." };
  }

  const day = input.day ?? new Date();
  const dayUtc = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()),
  );
  const amount = Math.max(1, Math.round(input.amount ?? 1));

  await prisma.listingAnalyticsDaily.upsert({
    where: {
      propertyId_day: { propertyId: property.id, day: dayUtc },
    },
    create: {
      propertyId: property.id,
      organizationId: property.organizationId,
      day: dayUtc,
      impressions: input.metric === "impressions" ? amount : 0,
      saves: input.metric === "saves" ? amount : 0,
      inquiries: input.metric === "inquiries" ? amount : 0,
    },
    update: {
      ...(input.metric === "impressions"
        ? { impressions: { increment: amount } }
        : {}),
      ...(input.metric === "saves" ? { saves: { increment: amount } } : {}),
      ...(input.metric === "inquiries"
        ? { inquiries: { increment: amount } }
        : {}),
    },
  });
  return { ok: true };
}

export async function getOrganizationListingAnalytics(input: {
  actor: OrgAccessActor;
  organizationId: string;
  fromDay?: Date;
  toDay?: Date;
}): Promise<
  | {
      ok: true;
      rows: ListingMetricRow[];
      totals: { impressions: number; saves: number; inquiries: number };
      /** Explicit: no user-level PII in this payload. */
      containsPii: false;
    }
  | { ok: false; error: string }
> {
  const access = await assertOrganizationAccess({
    actor: input.actor,
    organizationId: input.organizationId,
  });
  if (!access.ok) return { ok: false, error: access.error };

  const to = input.toDay ?? new Date();
  const from =
    input.fromDay ??
    new Date(to.getTime() - 30 * 86_400_000);

  const propertyWhere = buildPropertyTenantWhere({
    actorUserId: input.actor.userId,
    organizationId: input.organizationId,
    memberRole: access.memberRole,
  });

  const properties = await prisma.property.findMany({
    where: propertyWhere,
    select: { id: true, title: true, slug: true },
    take: 200,
  });
  const propertyIds = properties.map((p) => p.id);
  if (propertyIds.length === 0) {
    return {
      ok: true,
      rows: [],
      totals: { impressions: 0, saves: 0, inquiries: 0 },
      containsPii: false,
    };
  }

  const aggregates = await prisma.listingAnalyticsDaily.groupBy({
    by: ["propertyId"],
    where: {
      organizationId: input.organizationId,
      propertyId: { in: propertyIds },
      day: { gte: from, lte: to },
    },
    _sum: { impressions: true, saves: true, inquiries: true },
  });

  const byId = new Map(
    aggregates.map((a) => [
      a.propertyId,
      {
        impressions: a._sum.impressions ?? 0,
        saves: a._sum.saves ?? 0,
        inquiries: a._sum.inquiries ?? 0,
      },
    ]),
  );

  const rows: ListingMetricRow[] = properties.map((p) => {
    const m = byId.get(p.id) ?? {
      impressions: 0,
      saves: 0,
      inquiries: 0,
    };
    return {
      propertyId: p.id,
      title: p.title,
      slug: p.slug,
      ...m,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      impressions: acc.impressions + r.impressions,
      saves: acc.saves + r.saves,
      inquiries: acc.inquiries + r.inquiries,
    }),
    { impressions: 0, saves: 0, inquiries: 0 },
  );

  return { ok: true, rows, totals, containsPii: false };
}
