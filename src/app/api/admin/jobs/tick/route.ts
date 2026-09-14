import type { NextRequest } from "next/server";

import {
  adminErrorResponse,
  adminJson,
  auditAdminApiAccess,
  requireAdminApiPermission,
} from "@/domains/administration/api/admin-http";
import { processSystemJobTick } from "@/domains/operations/jobs/worker-tick";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/jobs/tick — process a small batch of queued jobs (non-blocking enqueue path).
 * Does not wait for large batches; rate-limited claim inside worker.
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminApiPermission("ops.jobs.write");
    const result = await processSystemJobTick({ limit: 5 });

    await auditAdminApiAccess({
      actor,
      action: "ops.api.jobs.tick",
      entityType: "SystemJob",
      request,
      meta: result,
    });

    return adminJson({ ok: true as const, ...result });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
