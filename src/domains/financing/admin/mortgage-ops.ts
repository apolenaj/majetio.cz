/**
 * Mortgage / HypotekaJasne operations — feed health + auto-publish gate.
 */

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";

export async function getMortgageFeedHealth(): Promise<{
  health: {
    autoPublishEnabled: boolean;
    blockedReason: string | null;
    blockedAt: Date | null;
    activeOffers: number;
    reviewRequiredOffers: number;
    staleOffers: number;
    inactiveOffers: number;
  };
  reviewQueue: Array<{
    id: string;
    bankName: string | null;
    productName: string | null;
    interestRateFrom: number | null;
    status: string;
    anomalyFlags: unknown;
    updatedAt: Date;
  }>;
  error: string | null;
}> {
  try {
    const control =
      (await prisma.mortgageFeedControl.findUnique({
        where: { id: "default" },
      })) ?? null;

    const [activeOffers, reviewRequiredOffers, staleOffers, inactiveOffers, reviewQueue] =
      await Promise.all([
        prisma.mortgageOffer.count({ where: { status: "ACTIVE" } }),
        prisma.mortgageOffer.count({ where: { status: "REVIEW_REQUIRED" } }),
        prisma.mortgageOffer.count({ where: { status: "STALE" } }),
        prisma.mortgageOffer.count({ where: { status: "INACTIVE" } }),
        prisma.mortgageOffer.findMany({
          where: { status: "REVIEW_REQUIRED" },
          orderBy: { updatedAt: "desc" },
          take: 40,
          select: {
            id: true,
            bankName: true,
            productName: true,
            interestRateFrom: true,
            status: true,
            anomalyFlags: true,
            updatedAt: true,
          },
        }),
      ]);

    return {
      health: {
        autoPublishEnabled: control?.autoPublishEnabled ?? true,
        blockedReason: control?.blockedReason ?? null,
        blockedAt: control?.blockedAt ?? null,
        activeOffers,
        reviewRequiredOffers,
        staleOffers,
        inactiveOffers,
      },
      reviewQueue,
      error: null,
    };
  } catch (err) {
    return {
      health: {
        autoPublishEnabled: true,
        blockedReason: null,
        blockedAt: null,
        activeOffers: 0,
        reviewRequiredOffers: 0,
        staleOffers: 0,
        inactiveOffers: 0,
      },
      reviewQueue: [],
      error: err instanceof Error ? err.message : "Mortgage health failed",
    };
  }
}

/**
 * Block auto-publish (anomalous feed) — new rates stay REVIEW_REQUIRED until admin review.
 */
export async function setMortgageAutoPublish(input: {
  enabled: boolean;
  reason: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.enabled && input.reason.trim().length < 8) {
    return { ok: false, error: "Reason required when blocking auto-publish." };
  }

  await prisma.mortgageFeedControl.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      autoPublishEnabled: input.enabled,
      blockedReason: input.enabled ? null : input.reason.trim(),
      blockedAt: input.enabled ? null : new Date(),
      blockedByUserId: input.enabled ? null : input.actorUserId,
    },
    update: {
      autoPublishEnabled: input.enabled,
      blockedReason: input.enabled ? null : input.reason.trim(),
      blockedAt: input.enabled ? null : new Date(),
      blockedByUserId: input.enabled ? null : input.actorUserId,
    },
  });

  await writeAuditLog({
    action: input.enabled
      ? "admin.mortgage.autopublish.enable"
      : "admin.mortgage.autopublish.block",
    entity: "MortgageFeedControl",
    entityId: "default",
    actorId: input.actorUserId,
    meta: { reason: input.reason.trim().slice(0, 300) },
  });

  return { ok: true };
}

export async function resolveMortgageOfferReview(input: {
  offerId: string;
  decision: "APPROVE" | "REJECT";
  reason: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Reason required." };
  }
  const offer = await prisma.mortgageOffer.findUnique({
    where: { id: input.offerId },
  });
  if (!offer) return { ok: false, error: "Offer not found." };

  const control = await prisma.mortgageFeedControl.findUnique({
    where: { id: "default" },
  });
  if (
    input.decision === "APPROVE" &&
    control &&
    !control.autoPublishEnabled
  ) {
    // Allow manual approve even when feed blocked — ops intentional
  }

  await prisma.mortgageOffer.update({
    where: { id: offer.id },
    data: {
      status: input.decision === "APPROVE" ? "ACTIVE" : "INACTIVE",
    },
  });

  await writeAuditLog({
    action: `admin.mortgage.offer.${input.decision.toLowerCase()}`,
    entity: "MortgageOffer",
    entityId: offer.id,
    actorId: input.actorUserId,
    meta: { reason: input.reason.trim().slice(0, 300) },
  });

  return { ok: true };
}

/** Worker helper — when auto-publish blocked, force review_required. */
export async function isMortgageAutoPublishEnabled(): Promise<boolean> {
  try {
    const control = await prisma.mortgageFeedControl.findUnique({
      where: { id: "default" },
    });
    return control?.autoPublishEnabled ?? true;
  } catch {
    return true;
  }
}
