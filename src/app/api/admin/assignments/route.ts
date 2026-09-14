import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  adminErrorResponse,
  adminJson,
  assertActorIsSessionUser,
  auditAdminApiAccess,
  parseJsonBody,
  parseSearchParams,
  requireAdminApiPermission,
} from "@/domains/administration/api/admin-http";
import {
  adminEntityKindSchema,
  createAssignmentBodySchema,
} from "@/domains/administration/api/admin-dtos";
import {
  createAdminAssignment,
  listAdminAssignments,
} from "@/domains/administration/api/admin-notes-assignments";

export const dynamic = "force-dynamic";

const listQuerySchema = z.object({
  assigneeUserId: z.string().trim().min(1).max(128).optional(),
  entityKind: adminEntityKindSchema.optional(),
  entityId: z.string().trim().min(1).max(128).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
});

/** GET /api/admin/assignments */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireAdminApiPermission("ops.assignments.read");
    const query = parseSearchParams(request, listQuerySchema);
    const assignments = await listAdminAssignments(query);

    await auditAdminApiAccess({
      actor,
      action: "ops.api.assignments.list",
      entityType: "AdminAssignment",
      request,
      meta: { count: assignments.length },
    });

    return adminJson({ ok: true as const, assignments });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

/** POST /api/admin/assignments */
export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminApiPermission("ops.assignments.write");
    const body = await parseJsonBody(request, createAssignmentBodySchema);
    assertActorIsSessionUser(actor.id, undefined);

    const assignment = await createAdminAssignment({
      entityKind: body.entityKind,
      entityId: body.entityId,
      assigneeUserId: body.assigneeUserId,
      assignedByUserId: actor.id,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      note: body.note,
    });

    await auditAdminApiAccess({
      actor,
      action: "ops.api.assignments.create",
      entityType: "AdminAssignment",
      entityId: assignment.id,
      request,
    });

    return adminJson({ ok: true as const, assignment }, { status: 201 });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
