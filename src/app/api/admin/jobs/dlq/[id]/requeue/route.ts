import type { NextRequest } from "next/server";

import {
  adminErrorResponse,
  adminJson,
  auditAdminApiAccess,
  requireAdminApiPermission,
} from "@/domains/administration/api/admin-http";
import { requeueDeadLetter } from "@/domains/operations/jobs/job-queue";

export const dynamic = "force-dynamic";

/** POST /api/admin/jobs/dlq/[id]/requeue */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminApiPermission("ops.jobs.write");
    const { id } = await context.params;
    const result = await requeueDeadLetter({
      deadLetterId: id,
      actorUserId: actor.id,
    });
    if (!result.ok) {
      return adminJson(
        { ok: false as const, error: result.error, code: "not_found" },
        { status: 404 },
      );
    }

    await auditAdminApiAccess({
      actor,
      action: "ops.api.jobs.dlq.requeue",
      entityType: "SystemJobDeadLetter",
      entityId: id,
      request,
    });

    return adminJson({ ok: true as const, jobId: result.jobId });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
