/**
 * Moderation / publish workflow mutations.
 */

import type { PropertyStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import { validatePropertyForPublish } from "@/domains/properties/admin/publish-validation";
import {
  buildUserFacingModerationMessage,
  requiresModerationReason,
  statusAfterModerationDecision,
  type ModerationDecision,
} from "@/domains/properties/admin/moderation-copy";

export async function submitPropertyForReview(input: {
  propertyId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    include: {
      _count: {
        select: {
          qualityIssues: { where: { severity: "CRITICAL", status: "OPEN" } },
        },
      },
    },
  });
  if (!property) return { ok: false, error: "Property not found." };

  const validation = validatePropertyForPublish({
    title: property.title,
    propertyType: property.propertyType,
    askingPrice: property.askingPrice,
    usableArea: property.usableArea,
    publicCity: property.publicCity,
    marketCode: property.marketCode,
    openCriticalDqCount: property._count.qualityIssues,
  });
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.issues.map((i) => i.message).join(" "),
    };
  }

  await prisma.property.update({
    where: { id: property.id },
    data: {
      status: "PENDING_REVIEW" as PropertyStatus,
      moderationReason: null,
      userFacingModerationMessage: null,
    } as Prisma.PropertyUpdateInput,
  });

  await prisma.propertyStatusHistory.create({
    data: {
      propertyId: property.id,
      previousStatus: property.status,
      newStatus: "PENDING_REVIEW" as PropertyStatus,
      reason: "submit_for_review",
      note: `actor=${input.actorUserId}`,
    },
  });

  return { ok: true };
}

export async function applyModerationDecision(input: {
  propertyId: string;
  decision: ModerationDecision;
  reason: string;
  actorUserId: string;
}): Promise<{ ok: true; userFacingMessage: string } | { ok: false; error: string }> {
  if (requiresModerationReason(input.decision) && input.reason.trim().length < 8) {
    return { ok: false, error: "Moderation reason is required." };
  }

  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    include: {
      _count: {
        select: {
          qualityIssues: { where: { severity: "CRITICAL", status: "OPEN" } },
        },
      },
    },
  });
  if (!property) return { ok: false, error: "Property not found." };

  if (input.decision === "APPROVE") {
    const validation = validatePropertyForPublish({
      title: property.title,
      propertyType: property.propertyType,
      askingPrice: property.askingPrice,
      usableArea: property.usableArea,
      publicCity: property.publicCity,
      marketCode: property.marketCode,
      openCriticalDqCount: property._count.qualityIssues,
    });
    if (!validation.ok) {
      return {
        ok: false,
        error: `Cannot approve: ${validation.issues.map((i) => i.message).join(" ")}`,
      };
    }
  }

  const nextStatus = statusAfterModerationDecision(input.decision);
  const userFacing = buildUserFacingModerationMessage({
    decision: input.decision,
    reason: input.reason,
  });

  await prisma.property.update({
    where: { id: property.id },
    data: {
      status: nextStatus as PropertyStatus,
      publishedAt:
        nextStatus === "ACTIVE" ? (property.publishedAt ?? new Date()) : property.publishedAt,
      moderationReason: input.reason.trim() || null,
      userFacingModerationMessage: userFacing,
      moderatedAt: new Date(),
      moderatedByUserId: input.actorUserId,
      listingModerationStatus:
        input.decision === "SUSPEND" ? "RESTRICTED" : "CLEAR",
    } as Prisma.PropertyUpdateInput,
  });

  await prisma.propertyStatusHistory.create({
    data: {
      propertyId: property.id,
      previousStatus: property.status,
      newStatus: nextStatus as PropertyStatus,
      reason: `moderation:${input.decision}`,
      note: input.reason.trim().slice(0, 500) || null,
    },
  });

  await writeAuditLog({
    action: `admin.property.moderate.${input.decision.toLowerCase()}`,
    entity: "Property",
    entityId: property.id,
    actorId: input.actorUserId,
    meta: {
      decision: input.decision,
      nextStatus,
      reason: input.reason.trim().slice(0, 300),
    },
  });

  if (nextStatus === "ACTIVE" && property.status !== "ACTIVE") {
    const { track } = await import("@/lib/analytics/events");
    track({
      name: "listing_published",
      props: { market_code: property.marketCode ?? "CZ" },
    });
  }

  return { ok: true, userFacingMessage: userFacing };
}
