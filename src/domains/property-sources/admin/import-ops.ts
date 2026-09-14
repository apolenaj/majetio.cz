/**
 * Import Operations Center — list, drilldown, idempotent retry.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import {
  presentImportJobStatus,
  type OpsImportJobStatus,
} from "@/domains/property-sources/service/import-status";

export type ImportJobListItem = {
  id: string;
  provider: string;
  sourceType: string;
  status: string;
  opsStatus: OpsImportJobStatus;
  processedCount: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  rejectedCount: number;
  idempotencyKey: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
};

export async function listImportJobs(input?: {
  status?: string;
  provider?: string;
  take?: number;
}): Promise<{ items: ImportJobListItem[]; error: string | null }> {
  try {
    const take = Math.min(input?.take ?? 40, 100);
    const where: Prisma.ImportJobWhereInput = {};
    if (input?.provider) {
      where.provider = { equals: input.provider, mode: "insensitive" };
    }
    if (input?.status) {
      const s = input.status;
      if (s === "QUEUED") {
        where.status = { in: ["QUEUED", "PENDING"] as never };
      } else if (s === "COMPLETED_WITH_WARNINGS") {
        where.status = {
          in: ["COMPLETED_WITH_WARNINGS", "PARTIAL"] as never,
        };
      } else {
        where.status = s as never;
      }
    }

    const rows = await prisma.importJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
    });

    const items: ImportJobListItem[] = rows.map((r) => ({
      id: r.id,
      provider: r.provider,
      sourceType: r.sourceType,
      status: r.status,
      opsStatus: presentImportJobStatus(r.status),
      processedCount: r.processedCount,
      successCount: r.successCount,
      errorCount: r.errorCount,
      skippedCount: r.skippedCount,
      rejectedCount: r.errorCount,
      idempotencyKey: r.idempotencyKey,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      createdAt: r.createdAt,
    }));

    return { items, error: null };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Import list failed",
    };
  }
}

export type ImportJobDetail = ImportJobListItem & {
  errors: Array<{
    itemIdempotencyKey?: string;
    externalPropertyId?: string;
    message: string;
    at?: string;
  }>;
  failedItems: Array<{
    id: string;
    idempotencyKey: string;
    externalPropertyId: string | null;
    errorMessage: string | null;
    status: string;
  }>;
  meta: unknown;
};

export async function getImportJobDetail(
  jobId: string,
): Promise<{ detail: ImportJobDetail | null; error: string | null }> {
  try {
    const job = await prisma.importJob.findUnique({
      where: { id: jobId },
      include: {
        items: {
          where: { status: "FAILED" },
          orderBy: { updatedAt: "desc" },
          take: 100,
        },
      },
    });
    if (!job) return { detail: null, error: null };

    const errorsRaw = Array.isArray(job.errors)
      ? (job.errors as ImportJobDetail["errors"])
      : [];

    return {
      detail: {
        id: job.id,
        provider: job.provider,
        sourceType: job.sourceType,
        status: job.status,
        opsStatus: presentImportJobStatus(job.status),
        processedCount: job.processedCount,
        successCount: job.successCount,
        errorCount: job.errorCount,
        skippedCount: job.skippedCount,
        rejectedCount: job.errorCount,
        idempotencyKey: job.idempotencyKey,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        createdAt: job.createdAt,
        errors: errorsRaw,
        failedItems: job.items.map((i) => ({
          id: i.id,
          idempotencyKey: i.idempotencyKey,
          externalPropertyId: i.externalPropertyId,
          errorMessage: i.errorMessage,
          status: i.status,
        })),
        meta: job.meta,
      },
      error: null,
    };
  } catch (err) {
    return {
      detail: null,
      error: err instanceof Error ? err.message : "Import detail failed",
    };
  }
}

/**
 * Idempotent retry: reset FAILED items in-place, re-queue job.
 * Does NOT create new item idempotency keys → no duplicate Properties.
 * SUCCEEDED items stay SUCCEEDED (workers must skip them).
 */
export async function retryFailedImportJob(input: {
  jobId: string;
  actorUserId: string;
}): Promise<
  | { ok: true; resetItemCount: number; jobId: string }
  | { ok: false; error: string }
> {
  const job = await prisma.importJob.findUnique({
    where: { id: input.jobId },
    include: {
      items: { where: { status: "FAILED" }, select: { id: true } },
    },
  });
  if (!job) return { ok: false, error: "Import job not found." };

  const ops = presentImportJobStatus(job.status);
  if (ops !== "FAILED" && ops !== "COMPLETED_WITH_WARNINGS") {
    return {
      ok: false,
      error: `Retry only for FAILED / COMPLETED_WITH_WARNINGS (got ${ops}).`,
    };
  }
  if (job.items.length === 0 && job.errorCount === 0) {
    return { ok: false, error: "No failed items to retry." };
  }

  const resetIds = job.items.map((i) => i.id);
  const priorMeta =
    job.meta && typeof job.meta === "object"
      ? (job.meta as Record<string, unknown>)
      : {};
  const retryCount = Number(priorMeta.retryCount ?? 0) + 1;

  await prisma.$transaction(async (tx) => {
    if (resetIds.length > 0) {
      await tx.importJobItem.updateMany({
        where: { id: { in: resetIds } },
        data: {
          status: "PENDING",
          errorMessage: null,
          processedAt: null,
        },
      });
    }

    await tx.importJob.update({
      where: { id: job.id },
      data: {
        status: "QUEUED" as never,
        finishedAt: null,
        startedAt: null,
        // Keep counters; workers recompute on run. Soft-adjust error count.
        errorCount: Math.max(0, job.errorCount - resetIds.length),
        meta: {
          ...priorMeta,
          retryCount,
          lastRetryAt: new Date().toISOString(),
          lastRetryBy: input.actorUserId,
          retryOfStatus: job.status,
          resetFailedItemIds: resetIds,
        } as Prisma.InputJsonValue,
      },
    });
  });

  await writeAuditLog({
    action: "admin.import.retry",
    entity: "ImportJob",
    entityId: job.id,
    actorId: input.actorUserId,
    meta: {
      resetItemCount: resetIds.length,
      retryCount,
      idempotencyKey: job.idempotencyKey,
      note: "in_place_failed_item_reset",
    },
  });

  return { ok: true, resetItemCount: resetIds.length, jobId: job.id };
}
