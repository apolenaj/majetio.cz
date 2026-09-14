/**
 * Monetization metrics — MRR/ARR (recurring only), GMV (≠ revenue), one-time sales.
 * Checklist 146–151, 200–205.
 */

import type { RevenueEventSourceType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCatalogProductByKey } from "@/config/pricing-architecture";

/** Source types treated as recurring subscription revenue. */
export const RECURRING_REVENUE_SOURCES: RevenueEventSourceType[] = [
  "SUBSCRIPTION",
];

/** One-time product revenue (not MRR). */
export const ONE_TIME_REVENUE_SOURCES: RevenueEventSourceType[] = [
  "ANALYSIS",
  "LISTING_BOOST",
  "PAY_PER_LEAD",
  "MORTGAGE_PARTNER",
  "OTHER",
];

/**
 * Map commerce productKey → ledger sourceType.
 */
export function mapProductKeyToRevenueSource(
  productKey: string,
): RevenueEventSourceType {
  const catalog = getCatalogProductByKey(productKey);
  if (catalog?.billingType === "SUBSCRIPTION") return "SUBSCRIPTION";
  if (
    productKey.startsWith("boost_") ||
    productKey === "boost_7_days" ||
    productKey === "boost_30_days"
  ) {
    return "LISTING_BOOST";
  }
  if (
    productKey.includes("analysis") ||
    productKey === "buyer_pass" ||
    productKey === "deep_analysis" ||
    productKey === "full_analysis" ||
    productKey === "expert_review" ||
    productKey === "investment_audit"
  ) {
    return "ANALYSIS";
  }
  if (
    productKey.startsWith("investor_pro") ||
    productKey.startsWith("agent_") ||
    productKey.startsWith("agency_") ||
    productKey.startsWith("developer_")
  ) {
    return "SUBSCRIPTION";
  }
  return "OTHER";
}

/**
 * Normalize recognized subscription amount to monthly minor units.
 * Annual plans → /12; monthly → as-is.
 */
export function normalizeToMonthlyMinor(
  amountGrossMinor: number,
  productKey?: string | null,
): number {
  if (amountGrossMinor <= 0) return 0;
  if (productKey?.includes("annual") || productKey?.includes("_year")) {
    return Math.round(amountGrossMinor / 12);
  }
  const catalog = productKey ? getCatalogProductByKey(productKey) : null;
  if (catalog?.limits && typeof catalog.limits === "object") {
    const interval = (catalog.limits as { billingInterval?: string })
      .billingInterval;
    if (interval === "ANNUAL") return Math.round(amountGrossMinor / 12);
  }
  return amountGrossMinor;
}

function isActiveSubscriptionEntitlement(row: {
  status: string;
  kind: string;
  billingInterval: string;
  productKey: string;
  expiresAt: Date | null;
  currentPeriodEnd: Date | null;
  now: Date;
}): boolean {
  if (!["ACTIVE", "TRIAL", "PAST_DUE"].includes(row.status)) return false;
  if (row.expiresAt && row.expiresAt <= row.now) return false;
  if (row.currentPeriodEnd && row.currentPeriodEnd <= row.now) return false;

  if (row.kind === "INVESTOR_PRO") return true;
  if (row.billingInterval === "MONTHLY" || row.billingInterval === "ANNUAL") {
    return true;
  }
  return mapProductKeyToRevenueSource(row.productKey) === "SUBSCRIPTION";
}

/**
 * Snapshot MRR from currently active recurring entitlements (canonical for 146/200).
 * Dedupes by userId+productKey (latest wins).
 */
export async function computeActiveSubscriptionMrrMinor(
  now = new Date(),
): Promise<number> {
  const rows = await prisma.entitlement.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIAL", "PAST_DUE"] },
      OR: [
        { kind: "INVESTOR_PRO" },
        { billingInterval: { in: ["MONTHLY", "ANNUAL"] } },
        { productKey: { startsWith: "investor_pro" } },
        { productKey: { startsWith: "agent_" } },
        { productKey: { startsWith: "agency_" } },
        { productKey: { startsWith: "developer_" } },
      ],
    },
    select: {
      userId: true,
      productKey: true,
      status: true,
      kind: true,
      billingInterval: true,
      expiresAt: true,
      currentPeriodEnd: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 5_000,
  });

  const seen = new Set<string>();
  let mrr = 0;

  for (const row of rows) {
    if (
      !isActiveSubscriptionEntitlement({
        ...row,
        now,
      })
    ) {
      continue;
    }
    const dedupeKey = `${row.userId}:${row.productKey}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const catalog = getCatalogProductByKey(row.productKey);
    const list = catalog?.priceGrossMinor ?? 0;
    if (list <= 0) continue;

    if (
      row.billingInterval === "ANNUAL" ||
      row.productKey.includes("annual") ||
      row.productKey.includes("_year")
    ) {
      mrr += Math.round(list / 12);
    } else {
      mrr += normalizeToMonthlyMinor(list, row.productKey);
    }
  }

  return mrr;
}

export type MonetizationDashboardMetrics = {
  /** Monthly recurring revenue — active SUBSCRIPTION entitlements snapshot. */
  mrrMinor: number;
  /** ARR = MRR × 12 (recurring only). */
  arrMinor: number;
  /**
   * GMV — gross merchandise / checkout volume from PAID orders.
   * STRICTLY not the same as recognized ledger revenue.
   */
  gmvMinor: number;
  /** Recognized one-time ledger sales (ANALYSIS, BOOST, PPL, …). */
  oneTimeSalesMinor: number;
  /** All RECOGNIZED ledger revenue (recurring + one-time + success fee). */
  recognizedRevenueMinor: number;
  /** SUCCESS_FEE recognized (subset of revenue, not GMV). */
  successFeeRevenueMinor: number;
  /** Marketplace broker commission volume (GMV proxy for MODE B deals). */
  marketplaceGmvMinor: number;
  /** Period recognized SUBSCRIPTION (not used as primary MRR). */
  periodSubscriptionRecognizedMinor: number;
  /** New PAID customers in window (CAC denominator helper). */
  newPayingCustomers: number;
  definitions: {
    mrr: string;
    arr: string;
    gmv: string;
    oneTime: string;
    revenueVsGmv: string;
  };
  asOf: string;
  windowFrom: string;
  windowTo: string;
};

export async function getMonetizationDashboardMetrics(input?: {
  from?: Date;
  to?: Date;
}): Promise<MonetizationDashboardMetrics> {
  const to = input?.to ?? new Date();
  const from = input?.from ?? new Date(to.getTime() - 30 * 86_400_000);

  const [recognized, paidOrders, verifiedFees, mrrMinor, newPaying] =
    await Promise.all([
      prisma.revenueEvent.findMany({
        where: {
          status: "RECOGNIZED",
          recognizedAt: { gte: from, lte: to },
        },
        select: {
          sourceType: true,
          amountGrossMinor: true,
          meta: true,
          orderId: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: from, lte: to },
        },
        _sum: { amountGrossMinor: true },
      }),
      prisma.successFeeRecord.aggregate({
        where: {
          status: { in: ["VERIFIED", "INVOICED", "PAID"] },
          verifiedAt: { gte: from, lte: to },
        },
        _sum: { brokerCommissionGrossMinor: true, feeAmountMinor: true },
      }),
      computeActiveSubscriptionMrrMinor(to),
      prisma.order.findMany({
        where: {
          status: "PAID",
          paidAt: { gte: from, lte: to },
          amountGrossMinor: { gt: 0 },
        },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

  let oneTimeSalesMinor = 0;
  let successFeeRevenueMinor = 0;
  let recognizedRevenueMinor = 0;
  let periodSubscriptionRecognizedMinor = 0;

  for (const row of recognized) {
    recognizedRevenueMinor += row.amountGrossMinor;
    const productKey =
      row.meta &&
      typeof row.meta === "object" &&
      !Array.isArray(row.meta) &&
      typeof (row.meta as { productKey?: unknown }).productKey === "string"
        ? (row.meta as { productKey: string }).productKey
        : null;

    if (row.sourceType === "SUBSCRIPTION") {
      periodSubscriptionRecognizedMinor += normalizeToMonthlyMinor(
        row.amountGrossMinor,
        productKey,
      );
    } else if (row.sourceType === "SUCCESS_FEE") {
      successFeeRevenueMinor += row.amountGrossMinor;
    } else if (
      (ONE_TIME_REVENUE_SOURCES as readonly string[]).includes(row.sourceType)
    ) {
      oneTimeSalesMinor += row.amountGrossMinor;
    }
  }

  const gmvMinor = paidOrders._sum.amountGrossMinor ?? 0;
  const marketplaceGmvMinor =
    verifiedFees._sum.brokerCommissionGrossMinor ?? 0;

  return {
    mrrMinor,
    arrMinor: mrrMinor * 12,
    gmvMinor,
    oneTimeSalesMinor,
    recognizedRevenueMinor,
    successFeeRevenueMinor,
    marketplaceGmvMinor,
    periodSubscriptionRecognizedMinor,
    newPayingCustomers: newPaying.length,
    definitions: {
      mrr: "Snapshot měsíčně normalizovaných ACTIVE/TRIAL/PAST_DUE subscription entitlements (ne GMV).",
      arr: "MRR × 12 — pouze recurring, ne one-time ani GMV.",
      gmv: "Součet amountGrossMinor u Order.status=PAID (checkout volume). Není ledger revenue.",
      oneTime:
        "RECOGNIZED ANALYSIS / LISTING_BOOST / PAY_PER_LEAD / MORTGAGE_PARTNER / OTHER v okně.",
      revenueVsGmv:
        "Revenue = RevenueEvent RECOGNIZED. GMV = PAID order gross. Nikdy je nesčítat do jedné KPI.",
    },
    asOf: to.toISOString(),
    windowFrom: from.toISOString(),
    windowTo: to.toISOString(),
  };
}
