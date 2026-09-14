import type { NextRequest } from "next/server";

import {
  adminErrorResponse,
  adminJson,
  auditAdminApiAccess,
  parseJsonBody,
  requireAdminApiPermission,
} from "@/domains/administration/api/admin-http";
import { updateAssignmentBodySchema } from "@/domains/administration/api/admin-dtos";
import { updateAdminAssignmentStatus } from "@/domains/administration/api/admin-notes-assignments";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/assignments/[id] */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminApiPermission("ops.assignments.write");
    const { id } = await context.params;
    const body = await parseJsonBody(request, updateAssignmentBodySchema);

    const result = await updateAdminAssignmentStatus({
      assignmentId: id,
      status: body.status,
      actorUserId: actor.id,
      note: body.note,
    });
    if (!result.ok) {
      return adminJson(
        { ok: false as const, error: result.error, code: "not_found" },
        { status: 404 },
      );
    }

    await auditAdminApiAccess({
      actor,
      action: "ops.api.assignments.patch",
      entityType: "AdminAssignment",
      entityId: id,
      request,
      meta: { status: body.status },
    });

    return adminJson({ ok: true as const, assignment: result.assignment });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
