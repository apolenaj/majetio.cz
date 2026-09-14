/**
 * Internal ops metrics for Admin UI (211–212).
 * Never invents values — returns null when samples are missing.
 */

import { prisma } from "@/lib/db";

export type AdminInternalMetrics = {
  /** Average latest completeness across datasets with scores; null if none. */
  dataCompletenessPct: number | null;
  datasetsScored: number;
  /** Failed jobs / finished jobs in last 24h; null if no finished jobs. */
  jobErrorRate24h: number | null;
  jobsFinished24h: number;
  /** Age of oldest queued/retrying job in minutes; null if queue empty. */
  queueAgeMinutes: number | null;
  queuedJobs: number;
  error: string | null;
};

export async function buildAdminInternalMetrics(input?: {
  now?: Date;
}): Promise<AdminInternalMetrics> {
  const now = input?.now ?? new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    const datasets = await prisma.datasetRegistry.findMany({
      where: { healthStatus: { not: "DISABLED" } },
      select: {
        qualityScores: {
          orderBy: { scoredAt: "desc" },
          take: 1,
          select: { completeness: true },
        },
      },
      take: 200,
    });

    const completenessValues = datasets
      .map((d) => d.qualityScores[0]?.completeness)
      .filter((v): v is number => typeof v === "number");

    const dataCompletenessPct =
      completenessValues.length > 0
        ? Math.round(
            (completenessValues.reduce((a, b) => a + b, 0) /
              completenessValues.length) *
              10,
          ) / 10
        : null;

    const [failedJobs, finishedJobs, oldestQueued, queuedJobs] =
      await Promise.all([
        prisma.systemJob.count({
          where: {
            status: "FAILED",
            finishedAt: { gte: dayAgo },
          },
        }),
        prisma.systemJob.count({
          where: {
            status: { in: ["SUCCEEDED", "FAILED", "CANCELLED"] },
            finishedAt: { gte: dayAgo },
          },
        }),
        prisma.systemJob.findFirst({
          where: { status: { in: ["QUEUED", "RETRYING"] } },
          orderBy: { scheduledAt: "asc" },
          select: { scheduledAt: true },
        }),
        prisma.systemJob.count({
          where: { status: { in: ["QUEUED", "RETRYING"] } },
        }),
      ]);

    const jobErrorRate24h =
      finishedJobs > 0
        ? Math.round((failedJobs / finishedJobs) * 1000) / 1000
        : null;

    const queueAgeMinutes = oldestQueued
      ? Math.max(
          0,
          Math.floor(
            (now.getTime() - oldestQueued.scheduledAt.getTime()) / 60_000,
          ),
        )
      : null;

    return {
      dataCompletenessPct,
      datasetsScored: completenessValues.length,
      jobErrorRate24h,
      jobsFinished24h: finishedJobs,
      queueAgeMinutes,
      queuedJobs,
      error: null,
    };
  } catch (err) {
    return {
      dataCompletenessPct: null,
      datasetsScored: 0,
      jobErrorRate24h: null,
      jobsFinished24h: 0,
      queueAgeMinutes: null,
      queuedJobs: 0,
      error:
        err instanceof Error
          ? err.message
          : "Nepodařilo se načíst interní metriky.",
    };
  }
}
