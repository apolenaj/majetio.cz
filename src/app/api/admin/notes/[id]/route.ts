import type { NextRequest } from "next/server";

import {
  adminErrorResponse,
  adminJson,
  auditAdminApiAccess,
  requireAdminApiPermission,
} from "@/domains/administration/api/admin-http";
import { softDeleteAdminEntityNote } from "@/domains/administration/api/admin-notes-assignments";

export const dynamic = "force-dynamic";

/** DELETE /api/admin/notes/[id] — soft-delete private note. */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminApiPermission("ops.notes.write");
    const { id } = await context.params;
    const result = await softDeleteAdminEntityNote({
      noteId: id,
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
      action: "ops.api.notes.delete",
      entityType: "AdminEntityNote",
      entityId: id,
      request,
    });

    return adminJson({ ok: true as const });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
