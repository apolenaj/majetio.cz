/**
 * Operational KPIs for Admin Control Center — no vanity metrics (no GMV/MRR here).
 */

import { prisma } from "@/lib/db";

export type OperationsKpis = {
  activeProperties: number;
  openDqIssues: number;
  criticalDqOpen: number;
  /** openDqIssues / activeProperties; null when no active properties. */
  dqIssueRate: number | null;
  importSuccessRate24h: number | null;
  importSuccessRate7d: number | null;
  paymentsPending: number;
  paymentsFailed: number;
  error: string | null;
};

function rate(success: number, processed: number): number | null {
  if (processed <= 0) return null;
  return Math.round((success / processed) * 1000) / 1000;
}

async function importRates(since: Date): Promise<number | null> {
  const agg = await prisma.importJob.aggregate({
    where: {
      createdAt: { gte: since },
      status: {
        in: [
          "SUCCEEDED",
          "FAILED",
          "PARTIAL",
          "COMPLETED_WITH_WARNINGS",
          "CANCELLED",
        ],
      },
    },
    _sum: {
      successCount: true,
      processedCount: true,
    },
  });
  return rate(agg._sum.successCount ?? 0, agg._sum.processedCount ?? 0);
}

export async function buildOperationsKpis(input?: {
  now?: Date;
}): Promise<OperationsKpis> {
  const now = input?.now ?? new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [
      activeProperties,
      openDqIssues,
      criticalDqOpen,
      paymentsPending,
      paymentsFailed,
      importSuccessRate24h,
      importSuccessRate7d,
    ] = await Promise.all([
      prisma.property.count({
        where: {
          status: "ACTIVE",
          visibility: "PUBLIC",
          isDemo: false,
        },
      }),
      prisma.dataQualityIssue.count({
        where: {
          status: { in: ["OPEN", "ACKNOWLEDGED", "IN_REVIEW"] },
        },
      }),
      prisma.dataQualityIssue.count({
        where: {
          status: { in: ["OPEN", "IN_REVIEW", "ACKNOWLEDGED"] },
          severity: "CRITICAL",
        },
      }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "FAILED" } }),
      importRates(dayAgo),
      importRates(weekAgo),
    ]);

    return {
      activeProperties,
      openDqIssues,
      criticalDqOpen,
      dqIssueRate:
        activeProperties > 0
          ? Math.round((openDqIssues / activeProperties) * 1000) / 1000
          : null,
      importSuccessRate24h,
      importSuccessRate7d,
      paymentsPending,
      paymentsFailed,
      error: null,
    };
  } catch (err) {
    return {
      activeProperties: 0,
      openDqIssues: 0,
      criticalDqOpen: 0,
      dqIssueRate: null,
      importSuccessRate24h: null,
      importSuccessRate7d: null,
      paymentsPending: 0,
      paymentsFailed: 0,
      error:
        err instanceof Error
          ? err.message
          : "Nepodařilo se načíst operativní KPI.",
    };
  }
}
