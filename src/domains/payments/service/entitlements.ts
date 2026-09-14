/**
 * Entitlement grant / revoke after payment confirmation (177–179).
 * Never grant on failed payment. PENDING_GRANT + retry on grant failure.
 * Routes B2C / B2B / Professional Review via EntitlementService + org plans.
 */

import type { EntitlementSource, EntitlementStatus, Prisma } from "@prisma/client";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  assertOrderEligibleForEntitlementGrant,
  isB2bSubscriptionProductKey,
  isProfessionalReviewProductKey,
  mapProductKeyToGrantRoute,
} from "@/domains/entitlements/grant-guard";

export type GrantEntitlementInput = {
  userId: string;
  orderId: string;
  productKey: string;
  analysisId?: string | null;
  propertyId?: string | null;
  organizationId?: string | null;
  contentVersionKey?: string | null;
  /** When true, skip PAID status check (only for internal retry after PAID). */
  skipPaidGuard?: boolean;
};

async function resolvePropertyId(
  input: GrantEntitlementInput,
  tx: Prisma.TransactionClient | typeof prisma,
): Promise<string | null> {
  if (input.propertyId) return input.propertyId;
  if (!input.analysisId) return null;
  const analysis = await tx.propertyAnalysis.findUnique({
    where: { id: input.analysisId },
    select: { propertyId: true },
  });
  return analysis?.propertyId ?? null;
}

async function resolveOrganizationId(
  input: GrantEntitlementInput,
  tx: Prisma.TransactionClient | typeof prisma,
): Promise<string | null> {
  if (input.organizationId) return input.organizationId;
  const membership = await tx.organizationMember.findFirst({
    where: {
      userId: input.userId,
      role: { in: ["OWNER", "ADMIN"] },
    },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });
  return membership?.organizationId ?? null;
}

export async function grantEntitlementForPaidOrder(
  input: GrantEntitlementInput,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<
  | { ok: true; entitlementId: string; status: EntitlementStatus }
  | { ok: false; error: string; pendingGrant: boolean; entitlementId?: string }
> {
  try {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      select: {
        id: true,
        status: true,
        amountGrossMinor: true,
        propertyId: true,
        organizationId: true,
        analysisId: true,
        productKey: true,
      },
    });
    if (!order) {
      return { ok: false, error: "Objednávka nenalezena.", pendingGrant: true };
    }

    if (!input.skipPaidGuard) {
      const eligibility = assertOrderEligibleForEntitlementGrant(order);
      if (!eligibility.ok) {
        return { ok: false, error: eligibility.error, pendingGrant: true };
      }
    }

    const propertyId =
      (await resolvePropertyId(
        {
          ...input,
          propertyId: input.propertyId ?? order.propertyId,
          analysisId: input.analysisId ?? order.analysisId,
        },
        tx,
      )) ?? null;
    const organizationId =
      (await resolveOrganizationId(
        {
          ...input,
          organizationId: input.organizationId ?? order.organizationId,
        },
        tx,
      )) ?? null;

    const enriched: GrantEntitlementInput = {
      ...input,
      productKey: input.productKey || order.productKey,
      analysisId: input.analysisId ?? order.analysisId,
      propertyId,
      organizationId,
    };

    const source: EntitlementSource =
      order.amountGrossMinor <= 0 ? "FREE_CHECKOUT" : "PAID_ORDER";

    const routed = await grantByProductRoute(enriched, source, tx);
    if (routed) return routed;

    const existing = await tx.entitlement.findUnique({
      where: { orderId: input.orderId },
    });
    if (existing?.status === "ACTIVE") {
      return { ok: true, entitlementId: existing.id, status: "ACTIVE" };
    }

    const row = existing
      ? await tx.entitlement.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            kind: "LEGACY_PRODUCT",
            source,
            grantedAt: new Date(),
            revokedAt: null,
            revokeReason: null,
            grantAttempts: { increment: 1 },
            lastGrantError: null,
            productKey: enriched.productKey,
            analysisId: enriched.analysisId ?? existing.analysisId,
            propertyId: enriched.propertyId ?? existing.propertyId,
          },
        })
      : await tx.entitlement.create({
          data: {
            userId: enriched.userId,
            orderId: enriched.orderId,
            analysisId: enriched.analysisId ?? null,
            propertyId: enriched.propertyId ?? null,
            productKey: enriched.productKey,
            kind: "LEGACY_PRODUCT",
            source,
            status: "ACTIVE",
            grantedAt: new Date(),
            grantAttempts: 1,
          },
        });

    await tx.user
      .update({
        where: { id: enriched.userId },
        data: { role: Role.PAID_CLIENT },
      })
      .catch(() => undefined);

    if (enriched.analysisId) {
      await tx.propertyAnalysis
        .update({
          where: { id: enriched.analysisId },
          data: { status: "PURCHASED", tier: "FULL" },
        })
        .catch(() => undefined);
    }

    return { ok: true, entitlementId: row.id, status: "ACTIVE" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Grant failed";
    try {
      const pending = await tx.entitlement.upsert({
        where: { orderId: input.orderId },
        create: {
          userId: input.userId,
          orderId: input.orderId,
          analysisId: input.analysisId ?? null,
          propertyId: input.propertyId ?? null,
          productKey: input.productKey,
          source: "PAID_ORDER",
          status: "PENDING_GRANT",
          grantAttempts: 1,
          lastGrantError: message,
        },
        update: {
          status: "PENDING_GRANT",
          grantAttempts: { increment: 1 },
          lastGrantError: message,
        },
      });
      return {
        ok: false,
        error: message,
        pendingGrant: true,
        entitlementId: pending.id,
      };
    } catch {
      return { ok: false, error: message, pendingGrant: true };
    }
  }
}

async function grantByProductRoute(
  input: GrantEntitlementInput,
  source: EntitlementSource,
  tx: Prisma.TransactionClient | typeof prisma,
): Promise<
  | { ok: true; entitlementId: string; status: EntitlementStatus }
  | { ok: false; error: string; pendingGrant: boolean; entitlementId?: string }
  | null
> {
  const route = mapProductKeyToGrantRoute(input.productKey);
  const {
    grantDeepAnalysis,
    grantBuyerPass,
    grantInvestorPro,
  } = await import("@/domains/entitlements/service");

  if (route === "deep_analysis") {
    if (!input.propertyId) {
      return {
        ok: false,
        error: "Deep Analysis vyžaduje propertyId (jedna analýza na property).",
        pendingGrant: true,
      };
    }
    const result = await grantDeepAnalysis({
      userId: input.userId,
      orderId: input.orderId,
      propertyId: input.propertyId,
      contentVersionKey: input.contentVersionKey ?? "v1",
      analysisId: input.analysisId,
      tx,
    });
    if (!result.ok) {
      return { ok: false, error: result.error, pendingGrant: true };
    }
    await tx.entitlement.update({
      where: { id: result.entitlementId },
      data: { source },
    });
    return { ok: true, entitlementId: result.entitlementId, status: "ACTIVE" };
  }

  if (route === "buyer_pass") {
    const result = await grantBuyerPass({
      userId: input.userId,
      orderId: input.orderId,
      tx,
    });
    if (!result.ok) {
      return { ok: false, error: result.error, pendingGrant: true };
    }
    await tx.entitlement.update({
      where: { id: result.entitlementId },
      data: { source },
    });
    return { ok: true, entitlementId: result.entitlementId, status: "ACTIVE" };
  }

  if (route === "investor_pro") {
    const interval =
      input.productKey === "investor_pro_annual" ? "ANNUAL" : "MONTHLY";
    const result = await grantInvestorPro({
      userId: input.userId,
      orderId: input.orderId,
      interval,
      tx,
    });
    if (!result.ok) {
      return { ok: false, error: result.error, pendingGrant: true };
    }
    await tx.entitlement.update({
      where: { id: result.entitlementId },
      data: { source },
    });
    return { ok: true, entitlementId: result.entitlementId, status: "TRIAL" };
  }

  if (route === "b2b_plan" || isB2bSubscriptionProductKey(input.productKey)) {
    return grantB2bPlan(input, source, tx);
  }

  if (
    route === "professional_review" ||
    isProfessionalReviewProductKey(input.productKey)
  ) {
    return grantProfessionalReview(input, source, tx);
  }

  if (route === "listing_boost") {
    if (!input.propertyId) {
      return {
        ok: false,
        error: "Boost vyžaduje propertyId.",
        pendingGrant: true,
      };
    }
    const { activateListingBoost } = await import(
      "@/domains/listing-promotions/service"
    );
    const result = await activateListingBoost({
      propertyId: input.propertyId,
      purchasedByUserId: input.userId,
      productKey: input.productKey as "boost_7_days" | "boost_30_days",
      orderId: input.orderId,
      tx,
    });
    if (!result.ok) {
      return { ok: false, error: result.error, pendingGrant: true };
    }
    const existing = await tx.entitlement.findUnique({
      where: { orderId: input.orderId },
    });
    const row = existing
      ? await tx.entitlement.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            kind: "LEGACY_PRODUCT",
            source,
            productKey: input.productKey,
            propertyId: input.propertyId,
            grantedAt: new Date(),
            expiresAt: result.endsAt,
            featureKeys: ["SPONSORED_PLACEMENT"],
            meta: {
              listingBoostId: result.boostId,
              affectsOrganicRanking: false,
              affectsMajetioScore: false,
            },
            grantAttempts: { increment: 1 },
            lastGrantError: null,
          },
        })
      : await tx.entitlement.create({
          data: {
            userId: input.userId,
            orderId: input.orderId,
            propertyId: input.propertyId,
            productKey: input.productKey,
            kind: "LEGACY_PRODUCT",
            source,
            status: "ACTIVE",
            grantedAt: new Date(),
            expiresAt: result.endsAt,
            featureKeys: ["SPONSORED_PLACEMENT"],
            meta: {
              listingBoostId: result.boostId,
              affectsOrganicRanking: false,
              affectsMajetioScore: false,
            },
            grantAttempts: 1,
          },
        });
    return { ok: true, entitlementId: row.id, status: "ACTIVE" };
  }

  return null;
}

async function grantB2bPlan(
  input: GrantEntitlementInput,
  source: EntitlementSource,
  tx: Prisma.TransactionClient | typeof prisma,
): Promise<
  | { ok: true; entitlementId: string; status: EntitlementStatus }
  | { ok: false; error: string; pendingGrant: boolean; entitlementId?: string }
> {
  if (!input.organizationId) {
    return {
      ok: false,
      error: "B2B předplatné vyžaduje organizationId.",
      pendingGrant: true,
    };
  }

  const { changeOrganizationPlan } = await import(
    "@/domains/organizations/service"
  );
  // Plan change uses its own transaction (quota OVER_LIMIT on downgrade).
  const planResult = await changeOrganizationPlan({
    organizationId: input.organizationId,
    toPlanKey: input.productKey,
    actorUserId: input.userId,
  });
  if (!planResult.ok) {
    return { ok: false, error: planResult.error, pendingGrant: true };
  }

  const existing = await tx.entitlement.findUnique({
    where: { orderId: input.orderId },
  });
  const row = existing
    ? await tx.entitlement.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          kind: "LEGACY_PRODUCT",
          source,
          productKey: input.productKey,
          grantedAt: new Date(),
          featureKeys: ["B2B_PLAN"],
          meta: {
            organizationId: input.organizationId,
            planChangeId: planResult.planChangeId,
            changeType: planResult.changeType,
            listingsMarkedOverLimit: planResult.listingsMarkedOverLimit,
          },
          grantAttempts: { increment: 1 },
          lastGrantError: null,
        },
      })
    : await tx.entitlement.create({
        data: {
          userId: input.userId,
          orderId: input.orderId,
          productKey: input.productKey,
          kind: "LEGACY_PRODUCT",
          source,
          status: "ACTIVE",
          grantedAt: new Date(),
          featureKeys: ["B2B_PLAN"],
          meta: {
            organizationId: input.organizationId,
            planChangeId: planResult.planChangeId,
            changeType: planResult.changeType,
            listingsMarkedOverLimit: planResult.listingsMarkedOverLimit,
          },
          grantAttempts: 1,
        },
      });

  return { ok: true, entitlementId: row.id, status: "ACTIVE" };
}

/** Bod 132 — after payment create HITL service order (not auto-analysis). */
async function grantProfessionalReview(
  input: GrantEntitlementInput,
  source: EntitlementSource,
  tx: Prisma.TransactionClient | typeof prisma,
): Promise<
  | { ok: true; entitlementId: string; status: EntitlementStatus }
  | { ok: false; error: string; pendingGrant: boolean; entitlementId?: string }
> {
  const kind =
    input.productKey === "investment_audit"
      ? "INVESTMENT_AUDIT"
      : "EXPERT_REVIEW";

  const existingReq = await prisma.professionalServiceRequest.findFirst({
    where: { orderId: input.orderId },
    select: { id: true },
  });

  let requestId = existingReq?.id;
  if (!requestId) {
    const { createProfessionalServiceRequest } = await import(
      "@/domains/professional-services/workflow"
    );
    const service = await createProfessionalServiceRequest({
      kind,
      requesterUserId: input.userId,
      propertyId: input.propertyId,
      analysisId: input.analysisId,
      orderId: input.orderId,
    });
    if (!service.ok) {
      return { ok: false, error: service.error, pendingGrant: true };
    }
    requestId = service.requestId;
  }

  const existing = await tx.entitlement.findUnique({
    where: { orderId: input.orderId },
  });
  const row = existing
    ? await tx.entitlement.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          kind: "LEGACY_PRODUCT",
          source,
          productKey: input.productKey,
          propertyId: input.propertyId ?? null,
          analysisId: input.analysisId ?? null,
          grantedAt: new Date(),
          featureKeys: ["PROFESSIONAL_REVIEW", kind],
          meta: {
            professionalServiceRequestId: requestId,
            humanInTheLoop: true,
            notAutomaticAnalysis: true,
          },
          grantAttempts: { increment: 1 },
          lastGrantError: null,
        },
      })
    : await tx.entitlement.create({
        data: {
          userId: input.userId,
          orderId: input.orderId,
          propertyId: input.propertyId ?? null,
          analysisId: input.analysisId ?? null,
          productKey: input.productKey,
          kind: "LEGACY_PRODUCT",
          source,
          status: "ACTIVE",
          grantedAt: new Date(),
          featureKeys: ["PROFESSIONAL_REVIEW", kind],
          meta: {
            professionalServiceRequestId: requestId,
            humanInTheLoop: true,
            notAutomaticAnalysis: true,
          },
          grantAttempts: 1,
        },
      });

  return { ok: true, entitlementId: row.id, status: "ACTIVE" };
}

export async function revokeEntitlementsForOrder(input: {
  orderId: string;
  reason: string;
}): Promise<number> {
  const result = await prisma.entitlement.updateMany({
    where: {
      orderId: input.orderId,
      source: { in: ["PAID_ORDER", "FREE_CHECKOUT"] },
      status: {
        in: ["ACTIVE", "PENDING_GRANT", "TRIAL", "PAST_DUE", "CANCELLED"],
      },
    },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokeReason: input.reason,
    },
  });
  return result.count;
}

export async function userHasActiveEntitlement(input: {
  userId: string;
  productKey: string;
  analysisId?: string | null;
}): Promise<boolean> {
  const row = await prisma.entitlement.findFirst({
    where: {
      userId: input.userId,
      productKey: input.productKey,
      status: { in: ["ACTIVE", "TRIAL", "PAST_DUE", "CANCELLED"] },
      ...(input.analysisId ? { analysisId: input.analysisId } : {}),
    },
    select: {
      id: true,
      expiresAt: true,
      status: true,
      gracePeriodEndsAt: true,
    },
  });
  if (!row) return false;
  const now = Date.now();
  if (row.expiresAt && row.expiresAt.getTime() < now) return false;
  if (
    row.status === "PAST_DUE" &&
    row.gracePeriodEndsAt &&
    row.gracePeriodEndsAt.getTime() < now
  ) {
    return false;
  }
  return true;
}

/** Recovery job: retry PENDING_GRANT after successful payment. */
export async function retryPendingEntitlementGrants(
  limit = 20,
): Promise<number> {
  const pending = await prisma.entitlement.findMany({
    where: { status: "PENDING_GRANT", grantAttempts: { lt: 10 } },
    take: limit,
    orderBy: { updatedAt: "asc" },
  });
  let fixed = 0;
  for (const row of pending) {
    if (!row.orderId) continue;
    const result = await grantEntitlementForPaidOrder({
      userId: row.userId,
      orderId: row.orderId,
      productKey: row.productKey,
      analysisId: row.analysisId,
      propertyId: row.propertyId,
      contentVersionKey: row.contentVersionKey,
    });
    if (result.ok) fixed += 1;
  }
  return fixed;
}
