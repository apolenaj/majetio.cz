/**
 * Lead dispute workflow — agents cannot void billable leads without evidence.
 */

import type { LeadDisputeReason, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { markRevenueDisputed, reverseRevenueEvent } from "./ledger";

function hasEvidence(meta: unknown): boolean {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return false;
  const record = meta as Record<string, unknown>;
  if (Array.isArray(record.documents) && record.documents.length > 0) return true;
  if (typeof record.summary === "string" && record.summary.trim().length >= 20) {
    return true;
  }
  if (typeof record.crmClientId === "string" && record.crmClientId.trim()) {
    return true;
  }
  return false;
}

/**
 * Open dispute. Without evidence → EVIDENCE_REQUIRED; lead stays billable.
 * Never auto-invalidates the lead.
 */
export async function openLeadDispute(input: {
  organizationId: string;
  qualifiedBuyerLeadId: string;
  openedByUserId: string;
  reason: LeadDisputeReason;
  agentStatement: string;
  evidenceMeta?: Record<string, unknown>;
}): Promise<
  | {
      ok: true;
      disputeId: string;
      status: "OPEN" | "EVIDENCE_REQUIRED";
      leadRemainsBillable: true;
    }
  | { ok: false; error: string }
> {
  const statement = input.agentStatement.trim();
  if (statement.length < 20) {
    return {
      ok: false,
      error: "Pro spor je potřeba písemné odůvodnění (min. 20 znaků).",
    };
  }

  const lead = await prisma.qualifiedBuyerLead.findFirst({
    where: {
      id: input.qualifiedBuyerLeadId,
      organizationId: input.organizationId,
    },
  });
  if (!lead) {
    return { ok: false, error: "Lead nenalezen v organizaci." };
  }

  const existing = await prisma.leadDispute.findFirst({
    where: {
      qualifiedBuyerLeadId: input.qualifiedBuyerLeadId,
      status: { in: ["OPEN", "EVIDENCE_REQUIRED", "UNDER_REVIEW"] },
    },
  });
  if (existing) {
    return { ok: false, error: "Pro tento lead už běží otevřený spor." };
  }

  const evidenceOk = hasEvidence(input.evidenceMeta);
  const status = evidenceOk ? "OPEN" : "EVIDENCE_REQUIRED";

  const revenue = await prisma.revenueEvent.findUnique({
    where: {
      sourceType_sourceEntityId: {
        sourceType: "PAY_PER_LEAD",
        sourceEntityId: input.qualifiedBuyerLeadId,
      },
    },
  });

  const dispute = await prisma.leadDispute.create({
    data: {
      organizationId: input.organizationId,
      qualifiedBuyerLeadId: input.qualifiedBuyerLeadId,
      openedByUserId: input.openedByUserId,
      status,
      reason: input.reason,
      agentStatement: statement.slice(0, 4000),
      evidenceRequired: true,
      evidenceSubmittedAt: evidenceOk ? new Date() : null,
      evidenceMeta: (input.evidenceMeta ?? undefined) as Prisma.InputJsonValue,
      revenueEventId: revenue?.id ?? null,
    },
  });

  if (revenue && status === "OPEN") {
    await markRevenueDisputed(revenue.id);
  }

  await prisma.qualifiedBuyerLeadActivity.create({
    data: {
      leadId: input.qualifiedBuyerLeadId,
      type: "DISPUTE_OPENED",
      note: evidenceOk
        ? "Spor otevřen s evidencí — čeká na review."
        : "Spor otevřen bez evidence — lead zůstává billable (EVIDENCE_REQUIRED).",
      meta: { disputeId: dispute.id, status },
    },
  });

  return {
    ok: true,
    disputeId: dispute.id,
    status,
    leadRemainsBillable: true,
  };
}

export async function submitDisputeEvidence(input: {
  disputeId: string;
  openedByUserId: string;
  evidenceMeta: Record<string, unknown>;
}): Promise<{ ok: true; status: "UNDER_REVIEW" } | { ok: false; error: string }> {
  const dispute = await prisma.leadDispute.findUnique({
    where: { id: input.disputeId },
  });
  if (!dispute) return { ok: false, error: "Spor nenalezen." };
  if (dispute.openedByUserId !== input.openedByUserId) {
    return { ok: false, error: "Spor může doplnit jen jeho autor." };
  }
  if (!["OPEN", "EVIDENCE_REQUIRED"].includes(dispute.status)) {
    return { ok: false, error: "Spor už není otevřený pro evidenci." };
  }
  if (!hasEvidence(input.evidenceMeta)) {
    return {
      ok: false,
      error:
        "Evidence je nedostatečná (dokumenty, CRM ID klienta, nebo podrobný popis min. 20 znaků).",
    };
  }

  await prisma.leadDispute.update({
    where: { id: dispute.id },
    data: {
      status: "UNDER_REVIEW",
      evidenceSubmittedAt: new Date(),
      evidenceMeta: input.evidenceMeta as Prisma.InputJsonValue,
    },
  });

  if (dispute.revenueEventId) {
    await markRevenueDisputed(dispute.revenueEventId);
  }

  return { ok: true, status: "UNDER_REVIEW" };
}

/**
 * Admin/ops resolution. UPHELD reverses revenue; REJECTED restores recognition path.
 * Never lets agent self-resolve to invalid without this step.
 */
export async function resolveLeadDispute(input: {
  disputeId: string;
  resolvedByUserId: string;
  outcome: "UPHELD" | "REJECTED";
  reviewNotes?: string;
  now?: Date;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const dispute = await prisma.leadDispute.findUnique({
    where: { id: input.disputeId },
  });
  if (!dispute) return { ok: false, error: "Spor nenalezen." };
  if (!["OPEN", "EVIDENCE_REQUIRED", "UNDER_REVIEW"].includes(dispute.status)) {
    return { ok: false, error: "Spor už je uzavřený." };
  }

  if (input.outcome === "UPHELD") {
    if (
      dispute.status === "EVIDENCE_REQUIRED" ||
      !hasEvidence(dispute.evidenceMeta)
    ) {
      return {
        ok: false,
        error:
          "Nelze uznat spor bez evidence — makléř nemůže účelově zneplatnit lead.",
      };
    }
  }

  const now = input.now ?? new Date();

  await prisma.leadDispute.update({
    where: { id: dispute.id },
    data: {
      status: input.outcome,
      resolvedAt: now,
      resolvedByUserId: input.resolvedByUserId,
      reviewNotes: input.reviewNotes?.slice(0, 2000) ?? null,
    },
  });

  if (input.outcome === "UPHELD" && dispute.revenueEventId) {
    await reverseRevenueEvent({
      revenueEventId: dispute.revenueEventId,
      reason: `Lead dispute UPHELD (${dispute.reason})`,
      now,
    });
  }

  if (input.outcome === "REJECTED" && dispute.revenueEventId) {
    await prisma.revenueEvent.updateMany({
      where: { id: dispute.revenueEventId, status: "DISPUTED" },
      data: { status: "RECOGNIZED", recognizedAt: now },
    });
  }

  await prisma.qualifiedBuyerLeadActivity.create({
    data: {
      leadId: dispute.qualifiedBuyerLeadId,
      type: input.outcome === "UPHELD" ? "DISPUTE_UPHELD" : "DISPUTE_REJECTED",
      note:
        input.outcome === "UPHELD"
          ? "Spor uznán — lead není billable, revenue reversed."
          : "Spor zamítnut — lead zůstává billable.",
      meta: { disputeId: dispute.id },
    },
  });

  return { ok: true };
}

/** Guard used by billing — billable unless dispute UPHELD. */
export async function isLeadBillable(
  qualifiedBuyerLeadId: string,
): Promise<boolean> {
  const upheld = await prisma.leadDispute.findFirst({
    where: { qualifiedBuyerLeadId, status: "UPHELD" },
  });
  return !upheld;
}
