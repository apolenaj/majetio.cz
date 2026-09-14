/**
 * Lead attribution persistence + multi-source manual review.
 * Double-attribution guards: 155 / 156.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  decideLeadAttribution,
  type AttributionTouchpoint,
} from "./attribution";
import { assertNoForcedDoubleAttribution } from "./double-attribution";
import { getOrgLeadBillingSettings } from "./billing";
import { writeMonetizationAuditLog } from "./monetization-audit";

export async function createLeadAttribution(input: {
  organizationId: string;
  qualifiedBuyerLeadId?: string | null;
  mortgageLeadId?: string | null;
  touchpoints: AttributionTouchpoint[];
  anchorAt?: Date;
  /** Forbidden when multi-source — use resolveAttributionReview instead. */
  proposedPrimarySourceKey?: string | null;
}): Promise<
  | {
      ok: true;
      attributionId: string;
      status: "ATTRIBUTED" | "MULTI_SOURCE_REVIEW" | "UNATTRIBUTED";
      primarySourceKey: string | null;
      requiresManualReview: boolean;
    }
  | { ok: false; error: string }
> {
  const settings = await getOrgLeadBillingSettings(input.organizationId);
  if (!settings) return { ok: false, error: "Organizace nenalezena." };

  const guarded = assertNoForcedDoubleAttribution({
    touchpoints: input.touchpoints,
    proposedPrimarySourceKey: input.proposedPrimarySourceKey,
    windowDays: settings.attributionWindowDays,
    anchorAt: input.anchorAt,
  });
  if (!guarded.ok) {
    return { ok: false, error: guarded.error };
  }

  const decision = guarded.decision;

  const row = await prisma.leadAttribution.create({
    data: {
      organizationId: input.organizationId,
      qualifiedBuyerLeadId: input.qualifiedBuyerLeadId ?? null,
      mortgageLeadId: input.mortgageLeadId ?? null,
      status: decision.status,
      sources: input.touchpoints as unknown as Prisma.InputJsonValue,
      primarySourceKey: decision.primarySourceKey,
      windowStartsAt: decision.windowStartsAt,
      windowEndsAt: decision.windowEndsAt,
      attributedAt: decision.status === "ATTRIBUTED" ? new Date() : null,
      reviewNotes: decision.reasonCs,
    },
  });

  return {
    ok: true,
    attributionId: row.id,
    status: decision.status,
    primarySourceKey: decision.primarySourceKey,
    requiresManualReview: decision.status === "MULTI_SOURCE_REVIEW",
  };
}

/**
 * Manual resolution after MULTI_SOURCE_REVIEW.
 * Does NOT create RevenueEvent — billing stays on MODE A/B paths only (155/156).
 */
export async function resolveAttributionReview(input: {
  attributionId: string;
  primarySourceKey: string;
  reviewedByUserId: string;
  notes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.leadAttribution.findUnique({
    where: { id: input.attributionId },
  });
  if (!row || row.status !== "MULTI_SOURCE_REVIEW") {
    return { ok: false, error: "Attribution není ve stavu MULTI_SOURCE_REVIEW." };
  }

  const sources = Array.isArray(row.sources) ? row.sources : [];
  const allowedKeys = new Set(
    sources
      .map((s) =>
        s &&
        typeof s === "object" &&
        !Array.isArray(s) &&
        typeof (s as { sourceKey?: unknown }).sourceKey === "string"
          ? (s as { sourceKey: string }).sourceKey.trim()
          : "",
      )
      .filter(Boolean),
  );

  if (!allowedKeys.has(input.primarySourceKey.trim())) {
    return {
      ok: false,
      error:
        "Primary source musí být jedním z konkurujících touchpointů (155/156).",
    };
  }

  await prisma.leadAttribution.update({
    where: { id: row.id },
    data: {
      status: "ATTRIBUTED",
      primarySourceKey: input.primarySourceKey.trim(),
      attributedAt: new Date(),
      reviewedAt: new Date(),
      reviewedByUserId: input.reviewedByUserId,
      reviewNotes: input.notes ?? row.reviewNotes,
    },
  });

  await writeMonetizationAuditLog({
    action: "attribution.resolve",
    entity: "LeadAttribution",
    entityId: row.id,
    actorId: input.reviewedByUserId,
    meta: {
      primarySourceKey: input.primarySourceKey.trim(),
      competingCount: allowedKeys.size,
      createsRevenue: false,
    },
  });

  return { ok: true };
}

/** Re-export for callers that only need the pure engine. */
export { decideLeadAttribution };
