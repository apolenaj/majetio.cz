/**
 * Investment assumptions governance — versioned + approval.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import {
  ASSUMPTION_CONFIG_V2026_07,
  type AssumptionConfigDocument,
} from "@/config/investment-assumptions";

export async function listAssumptionVersions(): Promise<{
  items: Array<{
    id: string;
    versionKey: string;
    label: string;
    isCurrent: boolean;
    approvalStatus: string;
    effectiveFrom: Date;
    changeReason: string | null;
  }>;
  error: string | null;
}> {
  try {
    const rows = await prisma.assumptionConfigVersion.findMany({
      orderBy: { effectiveFrom: "desc" },
      take: 40,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        versionKey: r.versionKey,
        label: r.label,
        isCurrent: r.isCurrent,
        approvalStatus:
          (r as { approvalStatus?: string }).approvalStatus ??
          (r.isCurrent ? "ACTIVE" : "DRAFT"),
        effectiveFrom: r.effectiveFrom,
        changeReason:
          (r as { changeReason?: string | null }).changeReason ?? null,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Assumptions list failed",
    };
  }
}

/**
 * Seed a DRAFT version from code defaults or previous ACTIVE (never mutates history).
 */
export async function createAssumptionDraftVersion(input: {
  versionKey: string;
  label: string;
  changeReason: string;
  config?: AssumptionConfigDocument;
  actorUserId: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.changeReason.trim().length < 8) {
    return { ok: false, error: "changeReason is required." };
  }
  const versionKey = input.versionKey.trim();
  if (!versionKey) return { ok: false, error: "versionKey required." };

  const existing = await prisma.assumptionConfigVersion.findUnique({
    where: { versionKey },
  });
  if (existing) return { ok: false, error: "versionKey already exists." };

  const current = await prisma.assumptionConfigVersion.findFirst({
    where: { isCurrent: true },
  });
  const baseConfig =
    input.config ??
    (current?.config as AssumptionConfigDocument | null) ??
    ASSUMPTION_CONFIG_V2026_07;

  const row = await prisma.assumptionConfigVersion.create({
    data: {
      versionKey,
      label: input.label.trim(),
      effectiveFrom: new Date(),
      isCurrent: false,
      approvalStatus: "DRAFT" as never,
      changeReason: input.changeReason.trim(),
      config: {
        ...baseConfig,
        versionKey,
        label: input.label.trim(),
      } as unknown as Prisma.InputJsonValue,
    },
  });

  await writeAuditLog({
    action: "admin.investment.assumptions.draft",
    entity: "AssumptionConfigVersion",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: { versionKey, reason: input.changeReason.trim().slice(0, 300) },
  });

  return { ok: true, id: row.id };
}

export async function submitAssumptionForApproval(input: {
  versionId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.assumptionConfigVersion.findUnique({
    where: { id: input.versionId },
  });
  if (!row) return { ok: false, error: "Version not found." };
  const status =
    (row as { approvalStatus?: string }).approvalStatus ?? "DRAFT";
  if (status !== "DRAFT" && status !== "REJECTED") {
    return { ok: false, error: `Cannot submit from ${status}.` };
  }
  await prisma.assumptionConfigVersion.update({
    where: { id: row.id },
    data: { approvalStatus: "PENDING_APPROVAL" as never },
  });
  return { ok: true };
}

export async function approveAndActivateAssumption(input: {
  versionId: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 12) {
    return { ok: false, error: "Approval reason min. 12 characters." };
  }
  const row = await prisma.assumptionConfigVersion.findUnique({
    where: { id: input.versionId },
  });
  if (!row) return { ok: false, error: "Version not found." };

  await prisma.$transaction(async (tx) => {
    await tx.assumptionConfigVersion.updateMany({
      where: { isCurrent: true },
      data: {
        isCurrent: false,
        effectiveTo: new Date(),
        approvalStatus: "APPROVED" as never,
      },
    });
    await tx.assumptionConfigVersion.update({
      where: { id: row.id },
      data: {
        isCurrent: true,
        approvalStatus: "ACTIVE" as never,
        approvedAt: new Date(),
        approvedByUserId: input.actorUserId,
        effectiveFrom: new Date(),
        effectiveTo: null,
      },
    });
  });

  await writeAuditLog({
    action: "admin.investment.assumptions.activate",
    entity: "AssumptionConfigVersion",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: {
      versionKey: row.versionKey,
      reason: input.reason.trim().slice(0, 300),
    },
  });

  return { ok: true };
}
