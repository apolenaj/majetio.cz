/**
 * Pricing Governance — draft → preview → approve → active (new version, never mutate sold).
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import { writeMonetizationAuditLog } from "@/domains/revenue/monetization-audit";

export async function listPricingPlansAdmin(input?: {
  key?: string;
  status?: string;
}): Promise<{
  items: Array<{
    id: string;
    key: string;
    versionKey: string;
    name: string;
    status: string;
    priceGrossMinor: number;
    currency: string;
    marketCode: string;
    activeFrom: Date;
    changeReason: string | null;
  }>;
  error: string | null;
}> {
  try {
    const where: Record<string, unknown> = {};
    if (input?.key) where.key = input.key;
    if (input?.status) where.status = input.status;

    const rows = await prisma.pricingPlan.findMany({
      where: where as never,
      orderBy: [{ key: "asc" }, { activeFrom: "desc" }],
      take: 80,
    });

    return {
      items: rows.map((r) => ({
        id: r.id,
        key: r.key,
        versionKey: r.versionKey,
        name: r.name,
        status: r.status,
        priceGrossMinor: r.priceGrossMinor,
        currency: r.currency,
        marketCode: r.marketCode,
        activeFrom: r.activeFrom,
        changeReason:
          (r as { changeReason?: string | null }).changeReason ?? null,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Pricing list failed",
    };
  }
}

/**
 * Create a new DRAFT version from an existing plan (or blank seed).
 * Never mutates historical ACTIVE rows sold to customers.
 */
export async function createPricingPlanDraft(input: {
  fromPlanId?: string;
  key: string;
  versionKey: string;
  name: string;
  priceGrossMinor: number;
  currency?: string;
  marketCode?: string;
  changeReason: string;
  effectiveFrom: Date;
  actorUserId: string;
  entitlesProductKey?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.changeReason.trim().length < 8) {
    return { ok: false, error: "changeReason required." };
  }
  if (!(input.priceGrossMinor >= 0)) {
    return { ok: false, error: "Invalid price." };
  }

  const existing = await prisma.pricingPlan.findUnique({
    where: {
      key_versionKey: { key: input.key, versionKey: input.versionKey },
    },
  });
  if (existing) return { ok: false, error: "versionKey already exists for key." };

  const from = input.fromPlanId
    ? await prisma.pricingPlan.findUnique({ where: { id: input.fromPlanId } })
    : null;

  const row = await prisma.pricingPlan.create({
    data: {
      key: input.key,
      versionKey: input.versionKey,
      name: input.name,
      description: from?.description ?? null,
      billingType: from?.billingType ?? "ONE_TIME",
      status: "DRAFT",
      priceGrossMinor: input.priceGrossMinor,
      currency: input.currency ?? from?.currency ?? "CZK",
      marketCode: input.marketCode ?? from?.marketCode ?? "CZ",
      countryCode: from?.countryCode ?? "CZ",
      taxRegion: from?.taxRegion ?? "CZ",
      vatRateBp: from?.vatRateBp ?? 2100,
      entitlesProductKey:
        input.entitlesProductKey ?? from?.entitlesProductKey ?? input.key,
      limits: from?.limits ?? undefined,
      features: from?.features ?? undefined,
      sortOrder: from?.sortOrder ?? 100,
      changeReason: input.changeReason.trim(),
      activeFrom: input.effectiveFrom,
      previewJson: {
        priceGrossMinor: input.priceGrossMinor,
        currency: input.currency ?? from?.currency ?? "CZK",
        effectiveFrom: input.effectiveFrom.toISOString(),
        fromVersionKey: from?.versionKey ?? null,
      } as Prisma.InputJsonValue,
    },
  });

  await writeMonetizationAuditLog({
    action: "pricing.plan.draft",
    entity: "PricingPlan",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: {
      key: row.key,
      versionKey: row.versionKey,
      reason: input.changeReason.trim().slice(0, 300),
    },
  });

  return { ok: true, id: row.id };
}

export function buildPricingPreview(plan: {
  key: string;
  versionKey: string;
  name: string;
  priceGrossMinor: number;
  currency: string;
  activeFrom: Date;
  status: string;
}): {
  headline: string;
  effectiveFromIso: string;
  canActivate: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  if (plan.status !== "DRAFT") {
    warnings.push("Only DRAFT plans can be activated via governance.");
  }
  if (plan.activeFrom.getTime() > Date.now() + 365 * 86400000) {
    warnings.push("Effective date is more than 1 year ahead.");
  }
  return {
    headline: `${plan.name} · ${(plan.priceGrossMinor / 100).toLocaleString("cs-CZ")} ${plan.currency} · ${plan.versionKey}`,
    effectiveFromIso: plan.activeFrom.toISOString(),
    canActivate: plan.status === "DRAFT",
    warnings,
  };
}

/**
 * Activate DRAFT → ACTIVE. Archives previous ACTIVE for same key+market.
 * Requires prior approval audit (caller enforces step-up).
 */
export async function activatePricingPlan(input: {
  planId: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 12) {
    return { ok: false, error: "Approval reason min. 12 characters." };
  }

  const plan = await prisma.pricingPlan.findUnique({
    where: { id: input.planId },
  });
  if (!plan) return { ok: false, error: "Plan not found." };
  if (plan.status !== "DRAFT") {
    return { ok: false, error: `Cannot activate from ${plan.status}.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pricingPlan.updateMany({
      where: {
        key: plan.key,
        marketCode: plan.marketCode,
        status: "ACTIVE",
        id: { not: plan.id },
      },
      data: {
        status: "ARCHIVED",
        activeTo: new Date(),
      },
    });
    await tx.pricingPlan.update({
      where: { id: plan.id },
      data: {
        status: "ACTIVE",
        approvedAt: new Date(),
        approvedByUserId: input.actorUserId,
        changeReason: input.reason.trim(),
      },
    });
  });

  await writeMonetizationAuditLog({
    action: "pricing.plan.activate",
    entity: "PricingPlan",
    entityId: plan.id,
    actorId: input.actorUserId,
    meta: {
      key: plan.key,
      versionKey: plan.versionKey,
      reason: input.reason.trim().slice(0, 300),
    },
  });

  await writeAuditLog({
    action: "admin.pricing.activate",
    entity: "PricingPlan",
    entityId: plan.id,
    actorId: input.actorUserId,
    meta: { key: plan.key, versionKey: plan.versionKey },
  });

  return { ok: true };
}

/**
 * Hard guard — admin must never force Payment to SUCCEEDED without provider reconciliation.
 */
export function assertCannotForcePaymentSucceeded(): {
  ok: false;
  error: string;
} {
  return {
    ok: false,
    error:
      "Nelze ručně nastavit platbu na SUCCEEDED. Použijte provider webhook / reconcilePaymentsEntitlementsAndRevenue.",
  };
}

export async function refuseManualPaymentSucceeded(input: {
  paymentId: string;
  actorUserId: string;
}): Promise<{ ok: false; error: string }> {
  await writeAuditLog({
    action: "admin.payment.force_succeeded.blocked",
    entity: "Payment",
    entityId: input.paymentId,
    actorId: input.actorUserId,
    meta: { blocked: true },
  });
  return assertCannotForcePaymentSucceeded();
}
