import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  adminErrorResponse,
  adminJson,
  auditAdminApiAccess,
  parseSearchParams,
  requireAdminApiPermission,
} from "@/domains/administration/api/admin-http";
import {
  listDeadLetterQueue,
  listSystemJobs,
  SYSTEM_JOB_KINDS,
  SYSTEM_JOB_STATUSES,
} from "@/domains/operations/jobs/job-queue";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  status: z.enum(SYSTEM_JOB_STATUSES).optional(),
  kind: z.enum(SYSTEM_JOB_KINDS).optional(),
  dlq: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
});

/** GET /api/admin/jobs?status=&kind=&dlq=1 */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireAdminApiPermission("ops.jobs.read");
    const query = parseSearchParams(request, querySchema);

    if (query.dlq) {
      const { items, error } = await listDeadLetterQueue();
      await auditAdminApiAccess({
        actor,
        action: "ops.api.jobs.dlq",
        entityType: "SystemJobDeadLetter",
        request,
      });
      return adminJson({ ok: true as const, deadLetters: items, error });
    }

    const { items, error } = await listSystemJobs({
      status: query.status,
      kind: query.kind,
    });

    await auditAdminApiAccess({
      actor,
      action: "ops.api.jobs.list",
      entityType: "SystemJob",
      request,
      meta: { count: items.length },
    });

    return adminJson({ ok: true as const, jobs: items, error });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
