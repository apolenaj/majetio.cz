import type { NextRequest } from "next/server";

import {
  adminErrorResponse,
  adminJson,
  auditAdminApiAccess,
  requireAdminApiPermission,
} from "@/domains/administration/api/admin-http";
import { buildSystemHealthReport } from "@/domains/operations/monitoring/system-health";

export const dynamic = "force-dynamic";

/** GET /api/admin/health — component health (db, queue, payments, search, providers). */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireAdminApiPermission("ops.health.read");
    const report = await buildSystemHealthReport();

    await auditAdminApiAccess({
      actor,
      action: "ops.api.health",
      entityType: "SystemHealth",
      request,
      meta: { overall: report.overall },
    });

    return adminJson({ ok: true as const, ...report });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
