/**
 * Background SystemJob queue + DLQ (139–150).
 * Enqueue is non-blocking; workers claim with rate limits.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeOpsAuditLog } from "@/domains/administration/audit/ops-audit-log";
import { isTransientJobError } from "@/domains/operations/jobs/transient-errors";

export const SYSTEM_JOB_STATUSES = [
  "QUEUED",
  "RUNNING",
  "RETRYING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "DEAD_LETTER",
] as const;

export type SystemJobStatus = (typeof SYSTEM_JOB_STATUSES)[number];

export const SYSTEM_JOB_KINDS = [
  "PROPERTY_RECALC",
  "PROPERTY_EVALUATION",
  "PROPERTY_MERGE",
  "MODEL_SHADOW_EVAL",
  "GENERIC",
] as const;

export type SystemJobKind = (typeof SYSTEM_JOB_KINDS)[number];

/** Max job starts per rateLimitKey per rolling minute. */
export const JOB_STARTS_PER_MINUTE = 20;

/** Max property IDs in a single recalc/eval payload. */
export const MAX_PROPERTY_IDS_PER_JOB = 100;

export type EnqueueJobInput = {
  kind: SystemJobKind;
  payload: Record<string, unknown>;
  priority?: number;
  maxAttempts?: number;
  rateLimitKey?: string;
  createdByUserId?: string | null;
  correlationId?: string | null;
  scheduledAt?: Date;
};

export async function enqueueSystemJob(
  input: EnqueueJobInput,
): Promise<{ ok: true; jobId: string } | { ok: false; error: string }> {
  if (input.kind === "PROPERTY_RECALC" || input.kind === "PROPERTY_EVALUATION") {
    const ids = Array.isArray(input.payload.propertyIds)
      ? (input.payload.propertyIds as unknown[])
      : [];
    if (ids.length === 0) {
      return { ok: false, error: "propertyIds required." };
    }
    if (ids.length > MAX_PROPERTY_IDS_PER_JOB) {
      return {
        ok: false,
        error: `Max ${MAX_PROPERTY_IDS_PER_JOB} propertyIds per job.`,
      };
    }
  }

  const row = await prisma.systemJob.create({
    data: {
      kind: input.kind,
      status: "QUEUED",
      priority: input.priority ?? 100,
      payload: input.payload as Prisma.InputJsonValue,
      maxAttempts: input.maxAttempts ?? 5,
      rateLimitKey: input.rateLimitKey ?? input.kind,
      createdByUserId: input.createdByUserId ?? null,
      correlationId: input.correlationId ?? null,
      scheduledAt: input.scheduledAt ?? new Date(),
    },
    select: { id: true },
  });

  if (input.createdByUserId) {
    await writeOpsAuditLog({
      action: "ops.job.enqueue",
      entityType: "SystemJob",
      entityId: row.id,
      actorId: input.createdByUserId,
      meta: { kind: input.kind },
    });
  }

  return { ok: true, jobId: row.id };
}

async function withinRateLimit(rateLimitKey: string): Promise<boolean> {
  const since = new Date(Date.now() - 60_000);
  const started = await prisma.systemJob.count({
    where: {
      rateLimitKey,
      startedAt: { gte: since },
      status: { in: ["RUNNING", "SUCCEEDED", "FAILED", "RETRYING", "DEAD_LETTER"] },
    },
  });
  return started < JOB_STARTS_PER_MINUTE;
}

/**
 * Claim next queued jobs (SKIP LOCKED style via status flip).
 * Returns claimed jobs for processing — caller must not block HTTP on heavy work.
 */
export async function claimQueuedJobs(input?: {
  limit?: number;
  kinds?: SystemJobKind[];
}): Promise<
  Array<{
    id: string;
    kind: SystemJobKind;
    payload: Record<string, unknown>;
    attempts: number;
    maxAttempts: number;
  }>
> {
  const limit = Math.min(input?.limit ?? 5, 20);
  const candidates = await prisma.systemJob.findMany({
    where: {
      status: { in: ["QUEUED", "RETRYING"] },
      scheduledAt: { lte: new Date() },
      ...(input?.kinds?.length ? { kind: { in: input.kinds } } : {}),
    },
    orderBy: [{ priority: "asc" }, { scheduledAt: "asc" }],
    take: limit * 3,
  });

  const claimed: Array<{
    id: string;
    kind: SystemJobKind;
    payload: Record<string, unknown>;
    attempts: number;
    maxAttempts: number;
  }> = [];

  for (const job of candidates) {
    if (claimed.length >= limit) break;
    const key = job.rateLimitKey ?? job.kind;
    if (!(await withinRateLimit(key))) continue;

    const updated = await prisma.systemJob.updateMany({
      where: {
        id: job.id,
        status: { in: ["QUEUED", "RETRYING"] },
      },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
    if (updated.count !== 1) continue;

    const fresh = await prisma.systemJob.findUnique({ where: { id: job.id } });
    if (!fresh) continue;

    claimed.push({
      id: fresh.id,
      kind: fresh.kind as SystemJobKind,
      payload: (fresh.payload ?? {}) as Record<string, unknown>,
      attempts: fresh.attempts,
      maxAttempts: fresh.maxAttempts,
    });
  }

  return claimed;
}

export async function completeSystemJob(
  jobId: string,
  progressPct = 100,
): Promise<void> {
  await prisma.systemJob.update({
    where: { id: jobId },
    data: {
      status: "SUCCEEDED",
      progressPct,
      finishedAt: new Date(),
      lastError: null,
    },
  });
}

export async function failSystemJob(input: {
  jobId: string;
  error: string;
  /** When false, skip retry schedule and go to DEAD_LETTER immediately. */
  retryable?: boolean;
}): Promise<{ deadLetter: boolean }> {
  const job = await prisma.systemJob.findUnique({ where: { id: input.jobId } });
  if (!job) return { deadLetter: false };

  const retryable =
    input.retryable ?? isTransientJobError(input.error);

  if (!retryable || job.attempts >= job.maxAttempts) {
    await prisma.$transaction(async (tx) => {
      await tx.systemJob.update({
        where: { id: job.id },
        data: {
          status: "DEAD_LETTER",
          lastError: input.error.slice(0, 4000),
          finishedAt: new Date(),
        },
      });
      await tx.systemJobDeadLetter.create({
        data: {
          jobId: job.id,
          kind: job.kind,
          payload: job.payload as Prisma.InputJsonValue,
          error: input.error.slice(0, 4000),
          attempts: job.attempts,
        },
      });
    });
    return { deadLetter: true };
  }

  await prisma.systemJob.update({
    where: { id: job.id },
    data: {
      status: "RETRYING",
      lastError: input.error.slice(0, 4000),
      scheduledAt: new Date(Date.now() + job.attempts * 15_000),
    },
  });
  return { deadLetter: false };
}

export async function listSystemJobs(input?: {
  status?: SystemJobStatus;
  kind?: SystemJobKind;
  take?: number;
}) {
  try {
    const rows = await prisma.systemJob.findMany({
      where: {
        status: input?.status,
        kind: input?.kind,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(input?.take ?? 40, 100),
    });
    return { items: rows, error: null as string | null };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Job list failed",
    };
  }
}

export async function listDeadLetterQueue(take = 40) {
  try {
    const rows = await prisma.systemJobDeadLetter.findMany({
      where: { requeuedAt: null },
      orderBy: { failedAt: "desc" },
      take: Math.min(take, 100),
    });
    return { items: rows, error: null as string | null };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "DLQ list failed",
    };
  }
}

export async function requeueDeadLetter(input: {
  deadLetterId: string;
  actorUserId: string;
}): Promise<{ ok: true; jobId: string } | { ok: false; error: string }> {
  const dlq = await prisma.systemJobDeadLetter.findUnique({
    where: { id: input.deadLetterId },
  });
  if (!dlq || dlq.requeuedAt) {
    return { ok: false, error: "Dead-letter entry not found or already requeued." };
  }

  const jobId = await prisma.$transaction(async (tx) => {
    await tx.systemJob.update({
      where: { id: dlq.jobId },
      data: {
        status: "QUEUED",
        attempts: 0,
        lastError: null,
        finishedAt: null,
        scheduledAt: new Date(),
        progressPct: 0,
      },
    });
    await tx.systemJobDeadLetter.update({
      where: { id: dlq.id },
      data: { requeuedAt: new Date() },
    });
    return dlq.jobId;
  });

  await writeOpsAuditLog({
    action: "ops.job.dlq.requeue",
    entityType: "SystemJobDeadLetter",
    entityId: input.deadLetterId,
    actorId: input.actorUserId,
    meta: { jobId },
  });

  return { ok: true, jobId };
}
