/**
 * Expert Review / Investment Audit — human-in-the-loop workflow.
 * These are NOT automated analysis engines.
 */

import type {
  ProfessionalServiceKind,
  ProfessionalServiceStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { sanitizeCrmPlainText } from "@/domains/crm/sanitize-notes";

export const PROFESSIONAL_SERVICE_TRANSITIONS: Record<
  ProfessionalServiceStatus,
  ProfessionalServiceStatus[]
> = {
  DRAFT: ["WAITING_FOR_INPUTS", "CANCELLED"],
  WAITING_FOR_INPUTS: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["ASSIGNED", "WAITING_FOR_INPUTS", "CANCELLED"],
  ASSIGNED: ["IN_REVIEW", "WAITING_FOR_INPUTS", "CANCELLED"],
  IN_REVIEW: ["NEEDS_CLARIFICATION", "DELIVERED", "CANCELLED"],
  NEEDS_CLARIFICATION: ["WAITING_FOR_INPUTS", "IN_REVIEW", "CANCELLED"],
  DELIVERED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export const PROFESSIONAL_SERVICE_STATUS_LABELS_CS: Record<
  ProfessionalServiceStatus,
  string
> = {
  DRAFT: "Koncept",
  WAITING_FOR_INPUTS: "Čeká na podklady",
  SUBMITTED: "Odesláno",
  ASSIGNED: "Přiřazeno specialistovi",
  IN_REVIEW: "Probíhá review",
  NEEDS_CLARIFICATION: "Vyžaduje upřesnění",
  DELIVERED: "Doručeno",
  CLOSED: "Uzavřeno",
  CANCELLED: "Zrušeno",
};

function canTransition(
  from: ProfessionalServiceStatus,
  to: ProfessionalServiceStatus,
): boolean {
  if (from === to) return true;
  return PROFESSIONAL_SERVICE_TRANSITIONS[from]?.includes(to) ?? false;
}

async function logActivity(input: {
  requestId: string;
  type: string;
  note?: string;
  actorUserId?: string | null;
  meta?: Record<string, unknown>;
  tx?: Prisma.TransactionClient | typeof prisma;
}): Promise<void> {
  const db = input.tx ?? prisma;
  await db.professionalServiceActivity.create({
    data: {
      requestId: input.requestId,
      type: input.type,
      note: input.note ? sanitizeCrmPlainText(input.note) : null,
      actorUserId: input.actorUserId ?? null,
      meta: (input.meta ?? undefined) as Prisma.InputJsonValue,
    },
  });
}

export async function createProfessionalServiceRequest(input: {
  kind: ProfessionalServiceKind;
  requesterUserId: string;
  propertyId?: string | null;
  analysisId?: string | null;
  orderId?: string | null;
  inputsChecklist?: Record<string, unknown>;
}): Promise<{ ok: true; requestId: string } | { ok: false; error: string }> {
  const row = await prisma.professionalServiceRequest.create({
    data: {
      kind: input.kind,
      status: "WAITING_FOR_INPUTS",
      requesterUserId: input.requesterUserId,
      propertyId: input.propertyId ?? null,
      analysisId: input.analysisId ?? null,
      orderId: input.orderId ?? null,
      inputsChecklist: (input.inputsChecklist ?? {
        propertyDocs: false,
        financialContext: false,
        questions: false,
      }) as Prisma.InputJsonValue,
      activities: {
        create: {
          type: "CREATED",
          note: `${input.kind} vytvořeno — human-in-the-loop (ne automatická analýza).`,
          actorUserId: input.requesterUserId,
        },
      },
    },
    select: { id: true },
  });
  return { ok: true, requestId: row.id };
}

export async function markProfessionalInputsReceived(input: {
  requestId: string;
  actorUserId: string;
  checklist?: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.professionalServiceRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!row) return { ok: false, error: "Požadavek nenalezen." };
  if (!canTransition(row.status, "SUBMITTED") && row.status !== "WAITING_FOR_INPUTS") {
    return { ok: false, error: `Nelze odeslat ze stavu ${row.status}.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.professionalServiceRequest.update({
      where: { id: row.id },
      data: {
        status: "SUBMITTED",
        inputsReceivedAt: new Date(),
        inputsChecklist: (input.checklist ??
          row.inputsChecklist ??
          undefined) as Prisma.InputJsonValue,
      },
    });
    await logActivity({
      requestId: row.id,
      type: "INPUTS_RECEIVED",
      note: "Podklady přijaty — čeká na přiřazení specialisty.",
      actorUserId: input.actorUserId,
      tx,
    });
  });
  return { ok: true };
}

export async function assignProfessionalService(input: {
  requestId: string;
  assigneeUserId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.professionalServiceRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!row) return { ok: false, error: "Požadavek nenalezen." };
  if (!canTransition(row.status, "ASSIGNED")) {
    return { ok: false, error: `Nelze přiřadit ze stavu ${row.status}.` };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.professionalServiceRequest.update({
      where: { id: row.id },
      data: {
        status: "ASSIGNED",
        assigneeUserId: input.assigneeUserId,
        assignedAt: now,
      },
    });
    await logActivity({
      requestId: row.id,
      type: "ASSIGNED",
      note: "Přiřazeno specialistovi.",
      actorUserId: input.actorUserId,
      meta: { assigneeUserId: input.assigneeUserId },
      tx,
    });
  });
  return { ok: true };
}

export async function startProfessionalReview(input: {
  requestId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.professionalServiceRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!row) return { ok: false, error: "Požadavek nenalezen." };
  if (!canTransition(row.status, "IN_REVIEW")) {
    return { ok: false, error: `Nelze spustit review ze stavu ${row.status}.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.professionalServiceRequest.update({
      where: { id: row.id },
      data: { status: "IN_REVIEW", reviewStartedAt: new Date() },
    });
    await logActivity({
      requestId: row.id,
      type: "IN_REVIEW",
      note: "Review zahájeno (human-in-the-loop).",
      actorUserId: input.actorUserId,
      tx,
    });
  });
  return { ok: true };
}

export async function deliverProfessionalService(input: {
  requestId: string;
  actorUserId: string;
  deliverySummary: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.professionalServiceRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!row) return { ok: false, error: "Požadavek nenalezen." };
  if (!canTransition(row.status, "DELIVERED")) {
    return { ok: false, error: `Nelze doručit ze stavu ${row.status}.` };
  }

  const summary = sanitizeCrmPlainText(input.deliverySummary, 4000);
  await prisma.$transaction(async (tx) => {
    await tx.professionalServiceRequest.update({
      where: { id: row.id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        deliverySummary: summary,
      },
    });
    await logActivity({
      requestId: row.id,
      type: "DELIVERED",
      note: "Výstup doručen žadateli.",
      actorUserId: input.actorUserId,
      tx,
    });
  });
  return { ok: true };
}
