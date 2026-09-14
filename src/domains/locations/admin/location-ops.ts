/**
 * Location Intelligence ops — mapping fixes + metric anomalies.
 */

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";

export async function listLocationMetricAnomalies(input?: {
  take?: number;
}): Promise<{
  items: Array<{
    id: string;
    locationId: string;
    locationSlug: string | null;
    metricKey: string;
    value: number;
    period: string;
    reviewRequired: boolean;
    freshness: string;
  }>;
  error: string | null;
}> {
  try {
    const rows = await prisma.locationMetric.findMany({
      where: { reviewRequired: true },
      orderBy: { calculatedAt: "desc" },
      take: Math.min(input?.take ?? 40, 100),
      include: {
        location: { select: { slug: true } },
      },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        locationId: r.locationId,
        locationSlug: r.location?.slug ?? null,
        metricKey: r.metricKey,
        value: r.value,
        period: String(r.period),
        reviewRequired: r.reviewRequired,
        freshness: r.freshness,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Location anomalies failed",
    };
  }
}

export async function clearLocationMetricReview(input: {
  metricId: string;
  reason: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Reason required." };
  }
  const metric = await prisma.locationMetric.findUnique({
    where: { id: input.metricId },
  });
  if (!metric) return { ok: false, error: "Metric not found." };

  await prisma.locationMetric.update({
    where: { id: metric.id },
    data: { reviewRequired: false },
  });

  await writeAuditLog({
    action: "admin.location.metric.clear_review",
    entity: "LocationMetric",
    entityId: metric.id,
    actorId: input.actorUserId,
    meta: {
      metricKey: metric.metricKey,
      reason: input.reason.trim().slice(0, 300),
    },
  });

  return { ok: true };
}

/**
 * Fix wrong property→location mapping (ops correction).
 */
export async function remappPropertyLocation(input: {
  propertyId: string;
  locationId: string;
  reason: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Reason required." };
  }

  const [property, location] = await Promise.all([
    prisma.property.findUnique({ where: { id: input.propertyId } }),
    prisma.location.findUnique({ where: { id: input.locationId } }),
  ]);
  if (!property) return { ok: false, error: "Property not found." };
  if (!location) return { ok: false, error: "Location not found." };

  const previousLocationId = property.locationId;
  await prisma.property.update({
    where: { id: property.id },
    data: {
      locationId: location.id,
      locationResolutionConfidence: "HIGH" as never,
      locationResolutionMeta: {
        remappedBy: input.actorUserId,
        remappedAt: new Date().toISOString(),
        previousLocationId,
        reason: input.reason.trim().slice(0, 300),
      },
    },
  });

  await writeAuditLog({
    action: "admin.location.property.remap",
    entity: "Property",
    entityId: property.id,
    actorId: input.actorUserId,
    meta: {
      previousLocationId,
      locationId: location.id,
      reason: input.reason.trim().slice(0, 300),
    },
  });

  return { ok: true };
}
