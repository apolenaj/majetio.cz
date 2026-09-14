/**
 * Private admin entity notes + assignments (151–155).
 */

import { prisma } from "@/lib/db";
import { writeOpsAuditLog } from "@/domains/administration/audit/ops-audit-log";
import type {
  AdminAssignmentDto,
  AdminEntityKind,
  AdminEntityNoteDto,
} from "@/domains/administration/api/admin-dtos";
import { sanitizePlainText } from "@/lib/security/sanitize";

function toNoteDto(row: {
  id: string;
  entityKind: string;
  entityId: string;
  body: string;
  authorUserId: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AdminEntityNoteDto {
  return {
    id: row.id,
    entityKind: row.entityKind as AdminEntityKind,
    entityId: row.entityId,
    body: row.body,
    authorUserId: row.authorUserId,
    isPinned: row.isPinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAssignmentDto(row: {
  id: string;
  entityKind: string;
  entityId: string;
  assigneeUserId: string;
  assignedByUserId: string;
  status: string;
  dueAt: Date | null;
  note: string | null;
  createdAt: Date;
  completedAt: Date | null;
}): AdminAssignmentDto {
  return {
    id: row.id,
    entityKind: row.entityKind as AdminEntityKind,
    entityId: row.entityId,
    assigneeUserId: row.assigneeUserId,
    assignedByUserId: row.assignedByUserId,
    status: row.status,
    dueAt: row.dueAt?.toISOString() ?? null,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export async function listAdminEntityNotes(input: {
  entityKind: AdminEntityKind;
  entityId: string;
}): Promise<AdminEntityNoteDto[]> {
  const rows = await prisma.adminEntityNote.findMany({
    where: {
      entityKind: input.entityKind,
      entityId: input.entityId,
      deletedAt: null,
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  return rows.map(toNoteDto);
}

export async function createAdminEntityNote(input: {
  entityKind: AdminEntityKind;
  entityId: string;
  body: string;
  authorUserId: string;
  isPinned?: boolean;
}): Promise<AdminEntityNoteDto> {
  const row = await prisma.adminEntityNote.create({
    data: {
      entityKind: input.entityKind,
      entityId: input.entityId,
      body: sanitizePlainText(input.body, 8_000),
      authorUserId: input.authorUserId,
      isPinned: input.isPinned ?? false,
    },
  });

  await writeOpsAuditLog({
    action: "ops.note.create",
    entityType: "AdminEntityNote",
    entityId: row.id,
    actorId: input.authorUserId,
    meta: {
      targetKind: input.entityKind,
      targetId: input.entityId,
    },
  });

  return toNoteDto(row);
}

export async function softDeleteAdminEntityNote(input: {
  noteId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.adminEntityNote.findUnique({
    where: { id: input.noteId },
  });
  if (!row || row.deletedAt) {
    return { ok: false, error: "Note not found." };
  }

  await prisma.adminEntityNote.update({
    where: { id: row.id },
    data: { deletedAt: new Date() },
  });

  await writeOpsAuditLog({
    action: "ops.note.delete",
    entityType: "AdminEntityNote",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: { targetKind: row.entityKind, targetId: row.entityId },
  });

  return { ok: true };
}

export async function createAdminAssignment(input: {
  entityKind: AdminEntityKind;
  entityId: string;
  assigneeUserId: string;
  assignedByUserId: string;
  dueAt?: Date | null;
  note?: string | null;
}): Promise<AdminAssignmentDto> {
  const row = await prisma.adminAssignment.create({
    data: {
      entityKind: input.entityKind,
      entityId: input.entityId,
      assigneeUserId: input.assigneeUserId,
      assignedByUserId: input.assignedByUserId,
      dueAt: input.dueAt ?? null,
      note: input.note
        ? sanitizePlainText(input.note, 2_000)
        : null,
      status: "OPEN",
    },
  });

  await writeOpsAuditLog({
    action: "ops.assignment.create",
    entityType: "AdminAssignment",
    entityId: row.id,
    actorId: input.assignedByUserId,
    meta: {
      targetKind: input.entityKind,
      targetId: input.entityId,
      assigneeUserId: input.assigneeUserId,
    },
  });

  return toAssignmentDto(row);
}

export async function updateAdminAssignmentStatus(input: {
  assignmentId: string;
  status: "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  actorUserId: string;
  note?: string | null;
}): Promise<{ ok: true; assignment: AdminAssignmentDto } | { ok: false; error: string }> {
  const row = await prisma.adminAssignment.findUnique({
    where: { id: input.assignmentId },
  });
  if (!row) return { ok: false, error: "Assignment not found." };

  const updated = await prisma.adminAssignment.update({
    where: { id: row.id },
    data: {
      status: input.status,
      note:
        input.note !== undefined
          ? input.note
            ? sanitizePlainText(input.note, 2_000)
            : null
          : row.note,
      completedAt:
        input.status === "DONE" || input.status === "CANCELLED"
          ? new Date()
          : null,
    },
  });

  await writeOpsAuditLog({
    action: "ops.assignment.status",
    entityType: "AdminAssignment",
    entityId: row.id,
    actorId: input.actorUserId,
    beforeSummary: row.status,
    afterSummary: input.status,
  });

  return { ok: true, assignment: toAssignmentDto(updated) };
}

export async function listAdminAssignments(input: {
  assigneeUserId?: string;
  entityKind?: AdminEntityKind;
  entityId?: string;
  status?: string;
}): Promise<AdminAssignmentDto[]> {
  const rows = await prisma.adminAssignment.findMany({
    where: {
      assigneeUserId: input.assigneeUserId,
      entityKind: input.entityKind,
      entityId: input.entityId,
      status: input.status as never,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map(toAssignmentDto);
}
