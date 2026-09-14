/**
 * Payment provider vs internal entitlements reconciliation (196–199).
 *
 * 196 — PAID without entitlement
 * 197 — PENDING_GRANT recovery
 * 198 — PAID without RevenueEvent
 * 199 — refunded/cancelled orders still ACTIVE or unreversed revenue
 */

import { prisma } from "@/lib/db";
import { writeMonetizationAuditLog } from "@/domains/revenue/monetization-audit";
import { grantEntitlementForPaidOrder } from "@/domains/payments/service/entitlements";
import { recognizeCommerceRevenueForPaidOrder } from "@/domains/revenue/commerce-recognition";
import { reverseRevenueEvent } from "@/domains/revenue/ledger";

export type ReconciliationFinding = {
  code: string;
  severity: "info" | "warning" | "error";
  orderId?: string;
  paymentId?: string;
  messageCs: string;
};

export type ReconciliationReport = {
  checkedPaidOrders: number;
  checkedRefundedOrders: number;
  missingEntitlements: number;
  pendingGrants: number;
  missingRevenueEvents: number;
  staleActiveAfterRefund: number;
  unreversedRevenueAfterRefund: number;
  findings: ReconciliationFinding[];
  repaired: {
    entitlementsRetried: number;
    revenueRecognized: number;
    revenueReversed: number;
  };
};

/**
 * Diff PAID orders vs ACTIVE/TRIAL entitlements and RevenueEvent rows.
 * Optionally attempt safe repairs (retry grant / recognize / reverse).
 */
export async function reconcilePaymentsEntitlementsAndRevenue(input?: {
  repair?: boolean;
  take?: number;
  now?: Date;
}): Promise<ReconciliationReport> {
  const repair = input?.repair === true;
  const take = Math.min(input?.take ?? 200, 500);
  const now = input?.now ?? new Date();

  const paidOrders = await prisma.order.findMany({
    where: { status: "PAID", amountGrossMinor: { gt: 0 } },
    orderBy: { paidAt: "desc" },
    take,
    select: {
      id: true,
      userId: true,
      productKey: true,
      amountGrossMinor: true,
      organizationId: true,
      currency: true,
      analysisId: true,
      propertyId: true,
      entitlements: {
        select: { id: true, status: true },
      },
    },
  });

  const refundedOrders = await prisma.order.findMany({
    where: {
      OR: [
        { status: "REFUNDED" },
        { refundedAt: { not: null } },
      ],
    },
    orderBy: { refundedAt: "desc" },
    take,
    select: {
      id: true,
      entitlements: {
        select: { id: true, status: true },
      },
    },
  });

  const findings: ReconciliationFinding[] = [];
  let missingEntitlements = 0;
  let pendingGrants = 0;
  let missingRevenueEvents = 0;
  let staleActiveAfterRefund = 0;
  let unreversedRevenueAfterRefund = 0;
  let entitlementsRetried = 0;
  let revenueRecognized = 0;
  let revenueReversed = 0;

  for (const order of paidOrders) {
    const active = order.entitlements.some((e) =>
      ["ACTIVE", "TRIAL", "PAST_DUE", "CANCELLED"].includes(e.status),
    );
    const pending = order.entitlements.some((e) => e.status === "PENDING_GRANT");

    if (!active && !pending) {
      missingEntitlements += 1;
      findings.push({
        code: "paid_without_entitlement",
        severity: "error",
        orderId: order.id,
        messageCs: "PAID order bez entitlementu.",
      });
      if (repair) {
        const grant = await grantEntitlementForPaidOrder({
          userId: order.userId,
          orderId: order.id,
          productKey: order.productKey,
          analysisId: order.analysisId,
          propertyId: order.propertyId,
          organizationId: order.organizationId,
        });
        if (grant.ok) entitlementsRetried += 1;
      }
    } else if (pending && !active) {
      pendingGrants += 1;
      findings.push({
        code: "pending_grant",
        severity: "warning",
        orderId: order.id,
        messageCs: "Entitlement ve stavu PENDING_GRANT.",
      });
      if (repair) {
        const grant = await grantEntitlementForPaidOrder({
          userId: order.userId,
          orderId: order.id,
          productKey: order.productKey,
          analysisId: order.analysisId,
          propertyId: order.propertyId,
          organizationId: order.organizationId,
        });
        if (grant.ok) entitlementsRetried += 1;
      }
    }

    const revenue = await prisma.revenueEvent.findFirst({
      where: {
        OR: [
          { orderId: order.id },
          {
            sourceEntityType: "Order",
            sourceEntityId: order.id,
          },
        ],
      },
      select: { id: true },
    });
    if (!revenue) {
      missingRevenueEvents += 1;
      findings.push({
        code: "paid_without_revenue_event",
        severity: "warning",
        orderId: order.id,
        messageCs: "PAID order bez RevenueEvent v ledgeru.",
      });
      if (repair) {
        const rec = await recognizeCommerceRevenueForPaidOrder({
          orderId: order.id,
          userId: order.userId,
          productKey: order.productKey,
          amountGrossMinor: order.amountGrossMinor,
          organizationId: order.organizationId,
          currency: order.currency,
          now,
        });
        if (rec.ok && rec.revenueEventId) revenueRecognized += 1;
      }
    }
  }

  for (const order of refundedOrders) {
    const stillActive = order.entitlements.filter((e) =>
      ["ACTIVE", "TRIAL", "PAST_DUE", "PENDING_GRANT"].includes(e.status),
    );
    if (stillActive.length > 0) {
      staleActiveAfterRefund += 1;
      findings.push({
        code: "refunded_with_active_entitlement",
        severity: "error",
        orderId: order.id,
        messageCs: "Refundovaná objednávka má stále aktivní entitlement.",
      });
      if (repair) {
        await prisma.entitlement.updateMany({
          where: {
            orderId: order.id,
            status: { in: ["ACTIVE", "TRIAL", "PAST_DUE", "PENDING_GRANT"] },
          },
          data: {
            status: "REVOKED",
            revokedAt: now,
            revokeReason: "reconciliation:refunded_order",
          },
        });
      }
    }

    const openRevenue = await prisma.revenueEvent.findFirst({
      where: {
        OR: [
          { orderId: order.id },
          { sourceEntityType: "Order", sourceEntityId: order.id },
        ],
        status: "RECOGNIZED",
      },
      select: { id: true },
    });
    if (openRevenue) {
      unreversedRevenueAfterRefund += 1;
      findings.push({
        code: "refunded_with_recognized_revenue",
        severity: "error",
        orderId: order.id,
        messageCs: "Refundovaná objednávka má nerozúčtovaný RECOGNIZED revenue.",
      });
      if (repair) {
        const rev = await reverseRevenueEvent({
          revenueEventId: openRevenue.id,
          reason: "reconciliation:order_refunded",
        });
        if (rev.ok) revenueReversed += 1;
      }
    }
  }

  const report: ReconciliationReport = {
    checkedPaidOrders: paidOrders.length,
    checkedRefundedOrders: refundedOrders.length,
    missingEntitlements,
    pendingGrants,
    missingRevenueEvents,
    staleActiveAfterRefund,
    unreversedRevenueAfterRefund,
    findings: findings.slice(0, 100),
    repaired: {
      entitlementsRetried,
      revenueRecognized,
      revenueReversed,
    },
  };

  await writeMonetizationAuditLog({
    action: "reconciliation.run",
    entity: "ReconciliationReport",
    meta: {
      checkedPaidOrders: report.checkedPaidOrders,
      checkedRefundedOrders: report.checkedRefundedOrders,
      missingEntitlements,
      pendingGrants,
      missingRevenueEvents,
      staleActiveAfterRefund,
      unreversedRevenueAfterRefund,
      repair,
      entitlementsRetried,
      revenueRecognized,
      revenueReversed,
      at: now.toISOString(),
    },
  });

  return report;
}
