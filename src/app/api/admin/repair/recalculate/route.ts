import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  adminErrorResponse,
  adminJson,
  auditAdminApiAccess,
  parseJsonBody,
  requireAdminApiPermission,
} from "@/domains/administration/api/admin-http";
import { enqueuePropertyBatchRepair } from "@/domains/operations/repair/property-repair";
import { MAX_PROPERTY_IDS_PER_JOB } from "@/domains/operations/jobs/job-queue";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    propertyIds: z.array(z.string().min(1)).min(1).max(MAX_PROPERTY_IDS_PER_JOB),
    mode: z.enum(["recalculate", "evaluate"]).default("recalculate"),
    reason: z.string().trim().min(8).max(500),
  })
  .strict();

/**
 * POST /api/admin/repair/recalculate
 * Enqueues batch work — returns immediately (queue + rate limit).
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminApiPermission("ops.repair.write");
    const body = await parseJsonBody(request, bodySchema);

    const result = await enqueuePropertyBatchRepair({
      propertyIds: body.propertyIds,
      mode: body.mode,
      actorUserId: actor.id,
      reason: body.reason,
    });
    if (!result.ok) {
      return adminJson(
        { ok: false as const, error: result.error, code: "enqueue_failed" },
        { status: 400 },
      );
    }

    // Fire-and-forget tick — do not await heavy processing on the request
    void import("@/domains/operations/jobs/worker-tick").then((m) =>
      m.processSystemJobTick({ limit: 2 }),
    );

    await auditAdminApiAccess({
      actor,
      action: "ops.api.repair.recalculate",
      entityType: "SystemJob",
      entityId: result.jobId,
      request,
      meta: { queuedCount: result.queuedCount, mode: body.mode },
    });

    return adminJson(
      {
        ok: true as const,
        jobId: result.jobId,
        queuedCount: result.queuedCount,
        message: "Queued — processing is asynchronous.",
      },
      { status: 202 },
    );
  } catch (err) {
    return adminErrorResponse(err);
  }
}
