import type { NextRequest } from "next/server";

import {
  adminErrorResponse,
  auditAdminApiAccess,
  rejectUniversalDbEditor,
  requireAdminApiPermission,
} from "@/domains/administration/api/admin-http";

export const dynamic = "force-dynamic";

/**
 * Catch-all ban for universal DB editor style paths (190–192).
 * GET/POST/PUT/PATCH/DELETE /api/admin/db/* → 403
 */
async function forbidden(request: NextRequest) {
  try {
    // Still require admin-zone auth so we can audit the attempt
    const actor = await requireAdminApiPermission("ops.dashboard.read");
    await auditAdminApiAccess({
      actor,
      action: "ops.api.db_editor.blocked",
      entityType: "Security",
      request,
      meta: { blocked: true },
    });
  } catch {
    // unauthenticated attempts still get 403 from reject
  }
  try {
    rejectUniversalDbEditor();
  } catch (err) {
    return adminErrorResponse(err);
  }
}

export const GET = forbidden;
export const POST = forbidden;
export const PUT = forbidden;
export const PATCH = forbidden;
export const DELETE = forbidden;
