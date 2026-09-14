import type { NextRequest } from "next/server";

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
  createNoteBodySchema,
  listNotesQuerySchema,
} from "@/domains/administration/api/admin-dtos";
import {
  createAdminEntityNote,
  listAdminEntityNotes,
} from "@/domains/administration/api/admin-notes-assignments";

export const dynamic = "force-dynamic";

/** GET /api/admin/notes?entityKind=&entityId= */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireAdminApiPermission("ops.notes.read");
    const query = parseSearchParams(request, listNotesQuerySchema);
    const notes = await listAdminEntityNotes(query);

    await auditAdminApiAccess({
      actor,
      action: "ops.api.notes.list",
      entityType: query.entityKind,
      entityId: query.entityId,
      request,
      meta: { count: notes.length },
    });

    return adminJson({ ok: true as const, notes });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

/** POST /api/admin/notes — private staff note (mutation: permission + zod). */
export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminApiPermission("ops.notes.write");
    const body = await parseJsonBody(request, createNoteBodySchema);
    assertActorIsSessionUser(actor.id, undefined);

    const note = await createAdminEntityNote({
      entityKind: body.entityKind,
      entityId: body.entityId,
      body: body.body,
      authorUserId: actor.id,
      isPinned: body.isPinned,
    });

    await auditAdminApiAccess({
      actor,
      action: "ops.api.notes.create",
      entityType: "AdminEntityNote",
      entityId: note.id,
      request,
    });

    return adminJson({ ok: true as const, note }, { status: 201 });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
