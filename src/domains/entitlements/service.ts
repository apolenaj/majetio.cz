/**
 * Central EntitlementService — B2C feature gates + lifecycle grants.
 * Free tier always allows BASIC_SCORE / BASIC_RISKS (no fake paywall).
 */

import type {
  Entitlement,
  EntitlementBillingInterval,
  EntitlementKind,
  EntitlementStatus,
  Prisma,
} from "@prisma/client";
import { Role } from "@prisma/client";

import {
  buyerPassConfig,
  deepAnalysisConfig,
  entitlementsB2cConfig,
  investorProConfig,
  majetioFreeConfig,
  type EntitlementFeature,
  isEntitlementFeature,
} from "@/config/entitlements-b2c";
import { prisma } from "@/lib/db";
import { getUsageQuantity, recordUsage, usageDayKey } from "./usage";
import { entitlementCoversMarket } from "./market-scope";

export type FeatureAccessResult =
  | {
      allowed: true;
      feature: EntitlementFeature;
      source: "free" | "deep_analysis" | "buyer_pass" | "investor_pro" | "legacy";
      entitlementId?: string;
    }
  | {
      allowed: false;
      feature: EntitlementFeature;
      reason: string;
      code:
        | "paywall"
        | "expired"
        | "rate_limited"
        | "wrong_property"
        | "version_stale"
        | "quota_exceeded"
        | "lifecycle"
        | "market_scope";
    };

const USABLE_STATUSES: EntitlementStatus[] = [
  "ACTIVE",
  "TRIAL",
  "PAST_DUE",
  "CANCELLED", // usable until expiresAt / period end
];

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 86_400_000);
}

function featuresForKind(kind: EntitlementKind, stored: string[]): EntitlementFeature[] {
  if (stored.length > 0) {
    return stored.filter(isEntitlementFeature);
  }
  switch (kind) {
    case "DEEP_ANALYSIS":
      return [...deepAnalysisConfig.features];
    case "BUYER_PASS":
      return [...buyerPassConfig.features];
    case "INVESTOR_PRO":
      return [...investorProConfig.features];
    case "FREE_TIER":
      return [...majetioFreeConfig.features];
    default:
      return ["BASIC_SCORE", "BASIC_RISKS", "DEEP_ANALYSIS", "FULL_SCENARIOS"];
  }
}

function isEntitlementUsable(row: Entitlement, now: Date): boolean {
  if (!USABLE_STATUSES.includes(row.status)) return false;
  if (row.status === "PAST_DUE") {
    if (row.gracePeriodEndsAt && row.gracePeriodEndsAt.getTime() < now.getTime()) {
      return false;
    }
  }
  if (row.status === "CANCELLED" || row.status === "ACTIVE" || row.status === "TRIAL") {
    if (row.expiresAt && row.expiresAt.getTime() < now.getTime()) return false;
    if (row.currentPeriodEnd && row.cancelAtPeriodEnd) {
      if (row.currentPeriodEnd.getTime() < now.getTime()) return false;
    }
  }
  return true;
}

async function listUsableEntitlements(userId: string, now: Date): Promise<Entitlement[]> {
  const rows = await prisma.entitlement.findMany({
    where: {
      userId,
      status: { in: USABLE_STATUSES },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.filter((r) => isEntitlementUsable(r, now));
}

/**
 * Expire rows that passed expiresAt / grace — best-effort housekeeping.
 */
export async function syncExpiredEntitlements(
  userId: string,
  now = new Date(),
): Promise<number> {
  const candidates = await prisma.entitlement.findMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIAL", "PAST_DUE", "CANCELLED"] },
      OR: [
        { expiresAt: { lt: now } },
        { gracePeriodEndsAt: { lt: now }, status: "PAST_DUE" },
        {
          cancelAtPeriodEnd: true,
          currentPeriodEnd: { lt: now },
        },
      ],
    },
    select: { id: true },
    take: 50,
  });
  if (candidates.length === 0) return 0;
  const result = await prisma.entitlement.updateMany({
    where: { id: { in: candidates.map((c) => c.id) } },
    data: { status: "EXPIRED" },
  });
  return result.count;
}

export async function assertFeatureAccess(input: {
  userId: string;
  feature: EntitlementFeature;
  propertyId?: string | null;
  contentVersionKey?: string | null;
  /** When true, increments anti-scrape counters for gated features. */
  recordView?: boolean;
  /**
   * Market the user is acting in. Paid entitlements must cover this market
   * (Buyer Pass CZ ≠ UAE Premium). Free tier ignores marketScope.
   */
  marketCode?: string | null;
  now?: Date;
}): Promise<FeatureAccessResult> {
  const now = input.now ?? new Date();
  const marketCode = (input.marketCode ?? "CZ").toUpperCase();
  await syncExpiredEntitlements(input.userId, now).catch(() => 0);

  // ── Free tier: real value, never blocked ─────────────────────────────────
  if (
    (majetioFreeConfig.features as readonly string[]).includes(input.feature)
  ) {
    if (input.recordView && input.feature === "BASIC_SCORE") {
      const views = await getUsageQuantity({
        userId: input.userId,
        featureKey: "FREE_TIER",
        metricKey: "property_detail_view",
        windowKey: usageDayKey(now),
      });
      if (views >= majetioFreeConfig.limits.propertyDetailViewsPerDay) {
        return {
          allowed: false,
          feature: input.feature,
          reason: "Denní limit prohlížení pro Free byl vyčerpán (ochrana proti scrapování).",
          code: "rate_limited",
        };
      }
      if (input.recordView) {
        await recordUsage({
          userId: input.userId,
          featureKey: "FREE_TIER",
          metricKey: "property_detail_view",
          propertyId: input.propertyId,
        });
      }
    }
    return { allowed: true, feature: input.feature, source: "free" };
  }

  const entitlements = (await listUsableEntitlements(input.userId, now)).filter(
    (e) =>
      entitlementCoversMarket({
        marketScope: (e as Entitlement & { marketScope?: string[] }).marketScope,
        marketCode,
      }),
  );

  const outOfScopePaid = (await listUsableEntitlements(input.userId, now)).some(
    (e) =>
      featuresForKind(e.kind, e.featureKeys).includes(input.feature) &&
      !entitlementCoversMarket({
        marketScope: (e as Entitlement & { marketScope?: string[] }).marketScope,
        marketCode,
      }),
  );

  // Investor Pro
  const pro = entitlements.find((e) => e.kind === "INVESTOR_PRO");
  if (pro && featuresForKind(pro.kind, pro.featureKeys).includes(input.feature)) {
    const limited = await enforceAntiScrape({
      userId: input.userId,
      feature: input.feature,
      propertyId: input.propertyId,
      limits: investorProConfig.antiScrape,
      recordView: input.recordView,
      now,
    });
    if (limited) return limited;
    return {
      allowed: true,
      feature: input.feature,
      source: "investor_pro",
      entitlementId: pro.id,
    };
  }

  // Buyer Pass
  const pass = entitlements.find((e) => e.kind === "BUYER_PASS");
  if (pass && featuresForKind(pass.kind, pass.featureKeys).includes(input.feature)) {
    if (input.feature === "DEEP_ANALYSIS") {
      const used = await getUsageQuantity({
        userId: input.userId,
        featureKey: "BUYER_PASS",
        metricKey: "deep_analysis_consume",
        windowKey: `pass:${pass.id}`,
      });
      if (used >= buyerPassConfig.deepAnalysesIncluded) {
        return {
          allowed: false,
          feature: input.feature,
          reason: "Buyer Pass: vyčerpán počet Deep Analysis v rámci passu.",
          code: "quota_exceeded",
        };
      }
    }
    const limited = await enforceAntiScrape({
      userId: input.userId,
      feature: input.feature,
      propertyId: input.propertyId,
      limits: buyerPassConfig.antiScrape,
      recordView: input.recordView,
      now,
    });
    if (limited) return limited;
    return {
      allowed: true,
      feature: input.feature,
      source: "buyer_pass",
      entitlementId: pass.id,
    };
  }

  // Deep Analysis — property + version scoped
  if (input.feature === "DEEP_ANALYSIS" || input.feature === "FULL_SCENARIOS") {
    const deep = entitlements.find(
      (e) =>
        e.kind === "DEEP_ANALYSIS" &&
        (!input.propertyId || e.propertyId === input.propertyId),
    );
    if (deep) {
      if (input.propertyId && deep.propertyId && deep.propertyId !== input.propertyId) {
        return {
          allowed: false,
          feature: input.feature,
          reason: "Deep Analysis platí jen pro zakoupenou nemovitost.",
          code: "wrong_property",
        };
      }
      if (
        input.contentVersionKey &&
        deep.contentVersionKey &&
        deep.contentVersionKey !== input.contentVersionKey
      ) {
        const refreshDue =
          deep.refreshAfter != null && deep.refreshAfter.getTime() <= now.getTime();
        if (refreshDue || deep.contentVersionKey !== input.contentVersionKey) {
          return {
            allowed: false,
            feature: input.feature,
            reason:
              "Verze analýzy se změnila — je potřeba nová Deep Analysis (není lifetime).",
            code: "version_stale",
          };
        }
      }
      return {
        allowed: true,
        feature: input.feature,
        source: "deep_analysis",
        entitlementId: deep.id,
      };
    }
  }

  // Legacy full_analysis product
  const legacy = entitlements.find(
    (e) =>
      e.kind === "LEGACY_PRODUCT" &&
      (e.productKey === "full_analysis" || e.productKey === "basic_analysis"),
  );
  if (legacy && featuresForKind(legacy.kind, legacy.featureKeys).includes(input.feature)) {
    return {
      allowed: true,
      feature: input.feature,
      source: "legacy",
      entitlementId: legacy.id,
    };
  }

  if (outOfScopePaid) {
    return {
      allowed: false,
      feature: input.feature,
      reason: `Aktivní předplatné neplatí pro trh ${marketCode} (marketScope).`,
      code: "market_scope",
    };
  }

  return {
    allowed: false,
    feature: input.feature,
    reason: "Tato funkce vyžaduje Deep Analysis, Buyer Pass nebo Investor Pro.",
    code: "paywall",
  };
}

async function enforceAntiScrape(input: {
  userId: string;
  feature: EntitlementFeature;
  propertyId?: string | null;
  limits: {
    propertyViewsPerDay: number;
    exportsPerDay: number;
    advancedComparisonsPerDay?: number;
  };
  recordView?: boolean;
  now: Date;
}): Promise<FeatureAccessResult | null> {
  const day = usageDayKey(input.now);
  if (input.feature === "ADVANCED_COMPARISON") {
    const used = await getUsageQuantity({
      userId: input.userId,
      featureKey: "ANTI_SCRAPE",
      metricKey: "advanced_comparison",
      windowKey: day,
    });
    const cap = input.limits.advancedComparisonsPerDay ?? 20;
    if (used >= cap) {
      return {
        allowed: false,
        feature: input.feature,
        reason: "Denní limit pokročilých porovnání (ochrana proti scrapování).",
        code: "rate_limited",
      };
    }
    if (input.recordView) {
      await recordUsage({
        userId: input.userId,
        featureKey: "ANTI_SCRAPE",
        metricKey: "advanced_comparison",
      });
    }
  }
  if (input.recordView && input.propertyId) {
    const views = await getUsageQuantity({
      userId: input.userId,
      featureKey: "ANTI_SCRAPE",
      metricKey: "property_view",
      windowKey: day,
    });
    if (views >= input.limits.propertyViewsPerDay) {
      return {
        allowed: false,
        feature: input.feature,
        reason: "Denní limit zobrazení nabídek (ochrana proti scrapování).",
        code: "rate_limited",
      };
    }
    await recordUsage({
      userId: input.userId,
      featureKey: "ANTI_SCRAPE",
      metricKey: "property_view",
      propertyId: input.propertyId,
    });
  }
  return null;
}

/** Consume one Buyer Pass deep-analysis slot after successful open. */
export async function consumeBuyerPassDeepAnalysis(input: {
  userId: string;
  entitlementId: string;
}): Promise<void> {
  await recordUsage({
    userId: input.userId,
    featureKey: "BUYER_PASS",
    metricKey: "deep_analysis_consume",
    windowKey: `pass:${input.entitlementId}`,
  });
}

// ─── Grants ──────────────────────────────────────────────────────────────────

export async function grantDeepAnalysis(input: {
  userId: string;
  orderId: string;
  propertyId: string;
  contentVersionKey: string;
  analysisId?: string | null;
  now?: Date;
  tx?: Prisma.TransactionClient | typeof prisma;
}): Promise<{ ok: true; entitlementId: string } | { ok: false; error: string }> {
  const now = input.now ?? new Date();
  const db = input.tx ?? prisma;
  const expiresAt = addDays(now, deepAnalysisConfig.accessDays);
  const refreshAfter = addDays(now, deepAnalysisConfig.refreshDays);

  try {
    const row = await db.entitlement.upsert({
      where: { orderId: input.orderId },
      create: {
        userId: input.userId,
        orderId: input.orderId,
        propertyId: input.propertyId,
        analysisId: input.analysisId ?? null,
        productKey: deepAnalysisConfig.productKey,
        kind: "DEEP_ANALYSIS",
        status: "ACTIVE",
        featureKeys: [...deepAnalysisConfig.features],
        contentVersionKey: input.contentVersionKey,
        expiresAt,
        refreshAfter,
        grantedAt: now,
        grantAttempts: 1,
      },
      update: {
        status: "ACTIVE",
        propertyId: input.propertyId,
        contentVersionKey: input.contentVersionKey,
        expiresAt,
        refreshAfter,
        grantedAt: now,
        featureKeys: [...deepAnalysisConfig.features],
        kind: "DEEP_ANALYSIS",
        productKey: deepAnalysisConfig.productKey,
        revokedAt: null,
        lastGrantError: null,
        grantAttempts: { increment: 1 },
      },
    });
    return { ok: true, entitlementId: row.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Deep Analysis grant failed",
    };
  }
}

export async function grantBuyerPass(input: {
  userId: string;
  orderId: string;
  durationDays?: number;
  now?: Date;
  tx?: Prisma.TransactionClient | typeof prisma;
}): Promise<{ ok: true; entitlementId: string; expiresAt: Date } | { ok: false; error: string }> {
  const now = input.now ?? new Date();
  const days = input.durationDays ?? buyerPassConfig.durationDays;
  const expiresAt = addDays(now, days);
  const db = input.tx ?? prisma;

  try {
    const row = await db.entitlement.upsert({
      where: { orderId: input.orderId },
      create: {
        userId: input.userId,
        orderId: input.orderId,
        productKey: buyerPassConfig.productKey,
        kind: "BUYER_PASS",
        status: "ACTIVE",
        featureKeys: [...buyerPassConfig.features],
        expiresAt,
        billingInterval: "NONE",
        grantedAt: now,
        grantAttempts: 1,
        meta: { autoRenew: false, note: "Buyer Pass is not a subscription" },
      },
      update: {
        status: "ACTIVE",
        kind: "BUYER_PASS",
        productKey: buyerPassConfig.productKey,
        featureKeys: [...buyerPassConfig.features],
        expiresAt,
        billingInterval: "NONE",
        grantedAt: now,
        revokedAt: null,
        cancelAtPeriodEnd: false,
        grantAttempts: { increment: 1 },
      },
    });
    await db.user
      .update({
        where: { id: input.userId },
        data: { role: Role.PAID_CLIENT },
      })
      .catch(() => undefined);
    return { ok: true, entitlementId: row.id, expiresAt };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Buyer Pass grant failed",
    };
  }
}

export async function grantInvestorPro(input: {
  userId: string;
  orderId: string;
  interval: "MONTHLY" | "ANNUAL";
  withTrial?: boolean;
  now?: Date;
  tx?: Prisma.TransactionClient | typeof prisma;
}): Promise<{ ok: true; entitlementId: string } | { ok: false; error: string }> {
  const now = input.now ?? new Date();
  const cfg =
    input.interval === "ANNUAL" ? investorProConfig.annual : investorProConfig.monthly;
  const billingInterval: EntitlementBillingInterval =
    input.interval === "ANNUAL" ? "ANNUAL" : "MONTHLY";
  const trial = input.withTrial !== false;
  const trialEndsAt = trial ? addDays(now, cfg.trialDays) : null;
  const periodStart = now;
  const periodEnd = addDays(now, cfg.periodDays);
  const status: EntitlementStatus = trial ? "TRIAL" : "ACTIVE";
  const db = input.tx ?? prisma;

  try {
    const row = await db.entitlement.upsert({
      where: { orderId: input.orderId },
      create: {
        userId: input.userId,
        orderId: input.orderId,
        productKey: investorProConfig.productKey,
        kind: "INVESTOR_PRO",
        status,
        featureKeys: [...investorProConfig.features],
        billingInterval,
        trialEndsAt,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        expiresAt: periodEnd,
        gracePeriodEndsAt: null,
        cancelAtPeriodEnd: false,
        grantedAt: now,
        grantAttempts: 1,
      },
      update: {
        status,
        kind: "INVESTOR_PRO",
        productKey: investorProConfig.productKey,
        featureKeys: [...investorProConfig.features],
        billingInterval,
        trialEndsAt,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        expiresAt: periodEnd,
        gracePeriodEndsAt: null,
        cancelAtPeriodEnd: false,
        grantedAt: now,
        revokedAt: null,
        grantAttempts: { increment: 1 },
      },
    });
    await db.user
      .update({
        where: { id: input.userId },
        data: { role: Role.PAID_CLIENT },
      })
      .catch(() => undefined);
    return { ok: true, entitlementId: row.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Investor Pro grant failed",
    };
  }
}

/**
 * Investor Pro lifecycle transitions.
 * trial→active, active→past_due (+ grace), past_due→expired, cancelAtPeriodEnd→expired/cancelled.
 */
export function nextInvestorProState(input: {
  status: EntitlementStatus;
  event:
    | "trial_end"
    | "payment_failed"
    | "payment_succeeded"
    | "cancel"
    | "period_end";
  billingInterval: EntitlementBillingInterval;
  gracePeriodEndsAt: Date | null;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  expiresAt: Date | null;
  cancelAtPeriodEnd: boolean;
  now?: Date;
}): {
  status: EntitlementStatus;
  gracePeriodEndsAt: Date | null;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  expiresAt: Date | null;
  cancelAtPeriodEnd: boolean;
} {
  const now = input.now ?? new Date();
  const cfg =
    input.billingInterval === "ANNUAL"
      ? investorProConfig.annual
      : investorProConfig.monthly;

  let status = input.status;
  let gracePeriodEndsAt = input.gracePeriodEndsAt;
  let trialEndsAt = input.trialEndsAt;
  let currentPeriodStart = input.currentPeriodStart;
  let currentPeriodEnd = input.currentPeriodEnd;
  let expiresAt = input.expiresAt;
  let cancelAtPeriodEnd = input.cancelAtPeriodEnd;

  switch (input.event) {
    case "trial_end": {
      if (input.status === "TRIAL") {
        status = "ACTIVE";
        trialEndsAt = now;
      }
      break;
    }
    case "payment_failed": {
      status = "PAST_DUE";
      gracePeriodEndsAt = addDays(now, cfg.graceDays);
      break;
    }
    case "payment_succeeded": {
      status = "ACTIVE";
      gracePeriodEndsAt = null;
      currentPeriodStart = now;
      currentPeriodEnd = addDays(now, cfg.periodDays);
      expiresAt = currentPeriodEnd;
      cancelAtPeriodEnd = false;
      break;
    }
    case "cancel": {
      cancelAtPeriodEnd = true;
      status = "CANCELLED";
      break;
    }
    case "period_end": {
      if (input.status === "PAST_DUE") {
        if (
          input.gracePeriodEndsAt &&
          input.gracePeriodEndsAt.getTime() < now.getTime()
        ) {
          status = "EXPIRED";
        }
      } else if (input.cancelAtPeriodEnd || input.status === "CANCELLED") {
        status = "EXPIRED";
      } else if (
        input.status === "TRIAL" &&
        input.trialEndsAt &&
        input.trialEndsAt <= now
      ) {
        status = "ACTIVE";
      }
      break;
    }
    default:
      break;
  }

  return {
    status,
    gracePeriodEndsAt,
    trialEndsAt,
    currentPeriodStart,
    currentPeriodEnd,
    expiresAt,
    cancelAtPeriodEnd,
  };
}

export async function transitionInvestorProLifecycle(input: {
  entitlementId: string;
  event:
    | "trial_end"
    | "payment_failed"
    | "payment_succeeded"
    | "cancel"
    | "period_end";
  now?: Date;
}): Promise<{ ok: true; status: EntitlementStatus } | { ok: false; error: string }> {
  const now = input.now ?? new Date();
  const row = await prisma.entitlement.findUnique({
    where: { id: input.entitlementId },
  });
  if (!row || row.kind !== "INVESTOR_PRO") {
    return { ok: false, error: "Investor Pro entitlement nenalezen." };
  }

  const next = nextInvestorProState({
    status: row.status,
    event: input.event,
    billingInterval: row.billingInterval,
    gracePeriodEndsAt: row.gracePeriodEndsAt,
    trialEndsAt: row.trialEndsAt,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    expiresAt: row.expiresAt,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    now,
  });

  const updated = await prisma.entitlement.update({
    where: { id: row.id },
    data: next,
  });

  return { ok: true, status: updated.status };
}

export function getFreeTierSummary() {
  return entitlementsB2cConfig.free;
}

export {
  majetioFreeConfig,
  deepAnalysisConfig,
  buyerPassConfig,
  investorProConfig,
  entitlementsB2cConfig,
};
