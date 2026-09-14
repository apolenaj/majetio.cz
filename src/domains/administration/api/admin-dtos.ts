/**
 * Admin DTO contracts — internal admin shapes vs public (never mix).
 */

import { z } from "zod";

import { maskEmail, maskPhone } from "@/domains/administration/security/masking";

export const ADMIN_ENTITY_KINDS = [
  "PROPERTY",
  "USER",
  "ORGANIZATION",
  "LEAD",
  "ORDER",
  "INCIDENT",
  "DATASET",
  "IMPORT_JOB",
] as const;

export type AdminEntityKind = (typeof ADMIN_ENTITY_KINDS)[number];

export const adminEntityKindSchema = z.enum(ADMIN_ENTITY_KINDS);

export const adminSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
  types: z
    .string()
    .optional()
    .transform((raw) => {
      if (!raw?.trim()) return [...ADMIN_ENTITY_KINDS];
      return raw
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
    }),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number(v ?? "8");
      if (!Number.isFinite(n)) return 8;
      return Math.min(Math.max(Math.floor(n), 1), 20);
    }),
});

export type AdminSearchHit = {
  entityKind: AdminEntityKind;
  entityId: string;
  title: string;
  subtitle: string | null;
  href: string;
};

/** Internal admin user card — emails/phones masked by default. */
export type AdminUserCardDto = {
  id: string;
  emailMasked: string | null;
  phoneMasked: string | null;
  name: string | null;
  role: string;
  accountStatus: string;
};

export function toAdminUserCardDto(row: {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  accountStatus?: string;
  phone?: string | null;
}): AdminUserCardDto {
  return {
    id: row.id,
    emailMasked: maskEmail(row.email),
    phoneMasked: maskPhone(row.phone ?? null),
    name: row.name,
    role: row.role,
    accountStatus: row.accountStatus ?? "ACTIVE",
  };
}

export const createNoteBodySchema = z
  .object({
    entityKind: adminEntityKindSchema,
    entityId: z.string().trim().min(1).max(128),
    body: z.string().trim().min(1).max(8000),
    isPinned: z.boolean().optional(),
    /** Forbidden — actor comes from session only. */
    authorUserId: z.undefined().optional(),
  })
  .strict();

export const listNotesQuerySchema = z.object({
  entityKind: adminEntityKindSchema,
  entityId: z.string().trim().min(1).max(128),
});

export type AdminEntityNoteDto = {
  id: string;
  entityKind: AdminEntityKind;
  entityId: string;
  body: string;
  authorUserId: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export const createAssignmentBodySchema = z
  .object({
    entityKind: adminEntityKindSchema,
    entityId: z.string().trim().min(1).max(128),
    assigneeUserId: z.string().trim().min(1).max(128),
    dueAt: z.string().datetime().optional().nullable(),
    note: z.string().trim().max(2000).optional().nullable(),
    /** Forbidden — assignedBy from session. */
    assignedByUserId: z.undefined().optional(),
  })
  .strict();

export const updateAssignmentBodySchema = z
  .object({
    status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"]),
    note: z.string().trim().max(2000).optional().nullable(),
  })
  .strict();

export type AdminAssignmentDto = {
  id: string;
  entityKind: AdminEntityKind;
  entityId: string;
  assigneeUserId: string;
  assignedByUserId: string;
  status: string;
  dueAt: string | null;
  note: string | null;
  createdAt: string;
  completedAt: string | null;
};
