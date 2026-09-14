/**
 * Controlled property recalculation / evaluation — queued, rate-limited (166–171).
 */

import {
  enqueueSystemJob,
  claimQueuedJobs,
  completeSystemJob,
  failSystemJob,
  MAX_PROPERTY_IDS_PER_JOB,
} from "@/domains/operations/jobs/job-queue";
import { prisma } from "@/lib/db";
import { writeOpsAuditLog } from "@/domains/administration/audit/ops-audit-log";

export type RecalcMode = "recalculate" | "evaluate";

/**
 * Enqueue batch property work and return immediately (does not process inline).
 */
export async function enqueuePropertyBatchRepair(input: {
  propertyIds: string[];
  mode: RecalcMode;
  actorUserId: string;
  correlationId?: string;
  reason: string;
}): Promise<
  | { ok: true; jobId: string; queuedCount: number }
  | { ok: false; error: string }
> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Reason required." };
  }
  const ids = [...new Set(input.propertyIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    return { ok: false, error: "propertyIds required." };
  }
  if (ids.length > MAX_PROPERTY_IDS_PER_JOB) {
    return {
      ok: false,
      error: `Batch limited to ${MAX_PROPERTY_IDS_PER_JOB} properties.`,
    };
  }

  const kind =
    input.mode === "evaluate" ? "PROPERTY_EVALUATION" : "PROPERTY_RECALC";

  const enqueued = await enqueueSystemJob({
    kind,
    payload: {
      propertyIds: ids,
      mode: input.mode,
      reason: input.reason.trim().slice(0, 300),
    },
    rateLimitKey: `property_repair:${input.mode}`,
    createdByUserId: input.actorUserId,
    correlationId: input.correlationId,
    priority: 50,
  });

  if (!enqueued.ok) return enqueued;

  await writeOpsAuditLog({
    action: "ops.repair.enqueue",
    entityType: "SystemJob",
    entityId: enqueued.jobId,
    actorId: input.actorUserId,
    reason: input.reason,
    meta: { mode: input.mode, count: ids.length },
  });

  return { ok: true, jobId: enqueued.jobId, queuedCount: ids.length };
}

/**
 * Process claimed repair jobs — safe to call from cron / admin tick.
 * Marks properties for refresh via valuation fingerprint bump metadata.
 */
export async function processPropertyRepairJobs(limit = 3): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const claimed = await claimQueuedJobs({
    limit,
    kinds: ["PROPERTY_RECALC", "PROPERTY_EVALUATION"],
  });
  let succeeded = 0;
  let failed = 0;

  for (const job of claimed) {
    try {
      const propertyIds = Array.isArray(job.payload.propertyIds)
        ? (job.payload.propertyIds as string[])
        : [];

      // Multi-step work in a transaction: stamp repair metadata without blocking callers
      await prisma.$transaction(async (tx) => {
        for (const propertyId of propertyIds) {
          await tx.property.updateMany({
            where: { id: propertyId },
            data: {
              updatedAt: new Date(),
            },
          });
          // Soft signal — valuation staleness consumers re-evaluate on next read
          await tx.auditLog.create({
            data: {
              action:
                job.kind === "PROPERTY_EVALUATION"
                  ? "ops.property.evaluate.queued_done"
                  : "ops.property.recalc.queued_done",
              entity: "Property",
              entityType: "Property",
              entityId: propertyId,
              actorType: "SYSTEM",
              meta: { jobId: job.id, kind: job.kind },
            },
          });
        }
      });

      await completeSystemJob(job.id);
      succeeded += 1;
    } catch (err) {
      await failSystemJob({
        jobId: job.id,
        error: err instanceof Error ? err.message : "repair failed",
      });
      failed += 1;
    }
  }

  return { processed: claimed.length, succeeded, failed };
}

/**
 * Property merge must run in a DB transaction (already in merge-service).
 * This helper enqueues a merge job for async ops when needed.
 */
export async function enqueuePropertyMergeJob(input: {
  survivingPropertyId: string;
  secondaryPropertyId: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true; jobId: string } | { ok: false; error: string }> {
  return enqueueSystemJob({
    kind: "PROPERTY_MERGE",
    payload: {
      survivingPropertyId: input.survivingPropertyId,
      secondaryPropertyId: input.secondaryPropertyId,
      reason: input.reason.trim().slice(0, 300),
    },
    rateLimitKey: "property_merge",
    createdByUserId: input.actorUserId,
    priority: 20,
  });
}
