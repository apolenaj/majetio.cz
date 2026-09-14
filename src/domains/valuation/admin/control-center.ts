/**
 * Valuation Control Center — model registry + performance + overrides.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import { buildAnalystOverrideAudit } from "@/domains/valuation/service/analyst-override";
import {
  canTransitionModelLifecycle,
  computeMaeMape,
  detectPerformanceRegression,
  type ModelLifecycleStatus,
  type AccuracyObservation,
} from "@/domains/valuation/admin/metrics";

export async function listValuationModels(): Promise<{
  items: Array<{
    id: string;
    code: string;
    displayName: string;
    algorithmVersion: string;
    marketCode: string;
    lifecycleStatus: string;
    isActive: boolean;
    shadowMode: boolean;
    previousActiveModelId: string | null;
    approvedAt: Date | null;
    activatedAt: Date | null;
  }>;
  error: string | null;
}> {
  try {
    const rows = await prisma.valuationModelRegistry.findMany({
      orderBy: [{ marketCode: "asc" }, { code: "asc" }],
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        code: r.code,
        displayName: r.displayName,
        algorithmVersion: r.algorithmVersion,
        marketCode: r.marketCode,
        lifecycleStatus:
          (r as { lifecycleStatus?: string }).lifecycleStatus ??
          (r.isActive ? "ACTIVE" : "DRAFT"),
        isActive: r.isActive,
        shadowMode: Boolean((r as { shadowMode?: boolean }).shadowMode),
        previousActiveModelId:
          (r as { previousActiveModelId?: string | null })
            .previousActiveModelId ?? null,
        approvedAt: (r as { approvedAt?: Date | null }).approvedAt ?? null,
        activatedAt: (r as { activatedAt?: Date | null }).activatedAt ?? null,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Model list failed",
    };
  }
}

export async function transitionValuationModel(input: {
  modelId: string;
  nextStatus: ModelLifecycleStatus;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Reason is required (min. 8 characters)." };
  }

  const model = await prisma.valuationModelRegistry.findUnique({
    where: { id: input.modelId },
  });
  if (!model) return { ok: false, error: "Model not found." };

  const current = ((model as { lifecycleStatus?: string }).lifecycleStatus ??
    (model.isActive ? "ACTIVE" : "DRAFT")) as ModelLifecycleStatus;

  // Normalize TESTING → REVIEW_REQUESTED for forward requests
  const nextStatus =
    input.nextStatus === "TESTING" ? "REVIEW_REQUESTED" : input.nextStatus;

  if (!canTransitionModelLifecycle(current, nextStatus)) {
    return {
      ok: false,
      error: `Invalid transition ${current} → ${nextStatus}.`,
    };
  }

  if (nextStatus === "ACTIVE") {
    if (current !== "APPROVED") {
      return {
        ok: false,
        error: "Must be APPROVED before ACTIVE.",
      };
    }
    if ((model as { shadowMode?: boolean }).shadowMode) {
      return {
        ok: false,
        error: "Disable shadow mode before activating (publish).",
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      let previousActiveId: string | null = null;

      if (nextStatus === "ACTIVE") {
        const previous = await tx.valuationModelRegistry.findFirst({
          where: {
            marketCode: model.marketCode,
            id: { not: model.id },
            OR: [
              { lifecycleStatus: "ACTIVE" as never },
              { isActive: true },
            ],
          },
        });
        previousActiveId = previous?.id ?? null;

        await tx.valuationModelRegistry.updateMany({
          where: {
            marketCode: model.marketCode,
            id: { not: model.id },
            OR: [
              { lifecycleStatus: "ACTIVE" as never },
              { isActive: true },
            ],
          },
          data: {
            lifecycleStatus: "APPROVED" as never,
            isActive: false,
          },
        });
      }

      const data: Record<string, unknown> = {
        lifecycleStatus: nextStatus,
        isActive: nextStatus === "ACTIVE",
      };
      if (nextStatus === "APPROVED") {
        data.approvedAt = new Date();
        data.approvedByUserId = input.actorUserId;
      }
      if (nextStatus === "ACTIVE") {
        data.activatedAt = new Date();
        data.activatedByUserId = input.actorUserId;
        data.previousActiveModelId = previousActiveId;
        data.rolledBackAt = null;
        data.shadowMode = false;
      }

      await tx.valuationModelRegistry.update({
        where: { id: model.id },
        data: data as Prisma.ValuationModelRegistryUpdateInput,
      });

      await tx.modelGovernanceEvent.create({
        data: {
          modelRegistryId: model.id,
          fromStatus: current,
          toStatus: nextStatus,
          actorUserId: input.actorUserId,
          reason: input.reason.trim(),
          shadowMode: (model as { shadowMode?: boolean }).shadowMode ?? false,
          meta: { previousActiveId },
        },
      });
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Transition failed",
    };
  }

  await writeAuditLog({
    action: `admin.valuation.model.${nextStatus.toLowerCase()}`,
    entity: "ValuationModelRegistry",
    entityId: model.id,
    actorId: input.actorUserId,
    meta: {
      code: model.code,
      from: current,
      to: nextStatus,
      reason: input.reason.trim().slice(0, 300),
    },
  });

  return { ok: true };
}

export async function setModelShadowMode(input: {
  modelId: string;
  shadowMode: boolean;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Reason required." };
  }
  const model = await prisma.valuationModelRegistry.findUnique({
    where: { id: input.modelId },
  });
  if (!model) return { ok: false, error: "Model not found." };
  if (model.isActive || model.lifecycleStatus === "ACTIVE") {
    return {
      ok: false,
      error: "Cannot enable shadow mode on ACTIVE published model.",
    };
  }

  await prisma.valuationModelRegistry.update({
    where: { id: model.id },
    data: { shadowMode: input.shadowMode },
  });

  await prisma.modelGovernanceEvent.create({
    data: {
      modelRegistryId: model.id,
      fromStatus: model.lifecycleStatus,
      toStatus: model.lifecycleStatus,
      actorUserId: input.actorUserId,
      reason: input.reason.trim(),
      shadowMode: input.shadowMode,
      meta: { action: "shadow_mode" },
    },
  });

  if (input.shadowMode) {
    const { enqueueSystemJob } = await import(
      "@/domains/operations/jobs/job-queue"
    );
    await enqueueSystemJob({
      kind: "MODEL_SHADOW_EVAL",
      payload: { modelId: model.id, marketCode: model.marketCode },
      createdByUserId: input.actorUserId,
      rateLimitKey: "model_shadow",
    });
  }

  await writeAuditLog({
    action: "admin.valuation.model.shadow",
    entity: "ValuationModelRegistry",
    entityId: model.id,
    actorId: input.actorUserId,
    meta: { shadowMode: input.shadowMode, reason: input.reason.slice(0, 300) },
  });

  return { ok: true };
}

/**
 * Safe rollback: reactivate previousActiveModelId and demote current ACTIVE.
 */
export async function rollbackValuationModel(input: {
  modelId: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true; restoredModelId: string } | { ok: false; error: string }> {
  if (input.reason.trim().length < 12) {
    return { ok: false, error: "Rollback reason min. 12 characters." };
  }

  const model = await prisma.valuationModelRegistry.findUnique({
    where: { id: input.modelId },
  });
  if (!model) return { ok: false, error: "Model not found." };
  if (model.lifecycleStatus !== "ACTIVE" && !model.isActive) {
    return { ok: false, error: "Only ACTIVE models can be rolled back." };
  }
  const previousId = (model as { previousActiveModelId?: string | null })
    .previousActiveModelId;
  if (!previousId) {
    return {
      ok: false,
      error: "No previousActiveModelId — cannot safely rollback.",
    };
  }

  const previous = await prisma.valuationModelRegistry.findUnique({
    where: { id: previousId },
  });
  if (!previous) {
    return { ok: false, error: "Previous model missing." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.valuationModelRegistry.update({
        where: { id: model.id },
        data: {
          lifecycleStatus: "APPROVED",
          isActive: false,
          rolledBackAt: new Date(),
        },
      });
      await tx.valuationModelRegistry.update({
        where: { id: previous.id },
        data: {
          lifecycleStatus: "ACTIVE",
          isActive: true,
          activatedAt: new Date(),
          activatedByUserId: input.actorUserId,
          shadowMode: false,
        },
      });
      await tx.modelGovernanceEvent.create({
        data: {
          modelRegistryId: model.id,
          fromStatus: "ACTIVE",
          toStatus: "APPROVED",
          actorUserId: input.actorUserId,
          reason: input.reason.trim(),
          meta: { rollbackTo: previous.id },
        },
      });
      await tx.modelGovernanceEvent.create({
        data: {
          modelRegistryId: previous.id,
          fromStatus: previous.lifecycleStatus,
          toStatus: "ACTIVE",
          actorUserId: input.actorUserId,
          reason: `Restored via rollback of ${model.code}`,
          meta: { restoredFrom: model.id },
        },
      });
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Rollback failed",
    };
  }

  await writeAuditLog({
    action: "admin.valuation.model.rollback",
    entity: "ValuationModelRegistry",
    entityId: model.id,
    actorId: input.actorUserId,
    meta: {
      restoredModelId: previous.id,
      reason: input.reason.trim().slice(0, 300),
    },
  });

  return { ok: true, restoredModelId: previous.id };
}

export async function compareValuationModels(input: {
  leftModelId: string;
  rightModelId: string;
}) {
  const { compareModelVersions } = await import(
    "@/domains/valuation/admin/metrics"
  );
  const [left, right] = await Promise.all([
    prisma.valuationModelRegistry.findUnique({ where: { id: input.leftModelId } }),
    prisma.valuationModelRegistry.findUnique({
      where: { id: input.rightModelId },
    }),
  ]);
  if (!left || !right) {
    return { ok: false as const, error: "Model not found." };
  }

  const [leftSnap, rightSnap] = await Promise.all([
    prisma.valuationModelPerformanceSnapshot.findFirst({
      where: { modelRegistryId: left.id },
      orderBy: { computedAt: "desc" },
    }),
    prisma.valuationModelPerformanceSnapshot.findFirst({
      where: { modelRegistryId: right.id },
      orderBy: { computedAt: "desc" },
    }),
  ]);

  return {
    ok: true as const,
    comparison: compareModelVersions({
      left: {
        algorithmVersion: left.algorithmVersion,
        lifecycleStatus: left.lifecycleStatus,
        mae: leftSnap?.mae,
      },
      right: {
        algorithmVersion: right.algorithmVersion,
        lifecycleStatus: right.lifecycleStatus,
        mae: rightSnap?.mae,
      },
    }),
  };
}

export async function recordModelPerformanceSnapshot(input: {
  modelRegistryId: string;
  marketCode?: string;
  segmentKey?: string;
  observations: AccuracyObservation[];
}): Promise<
  | { ok: true; snapshotId: string; regressionAlert: boolean }
  | { ok: false; error: string }
> {
  const metrics = computeMaeMape(input.observations);
  if (!metrics) return { ok: false, error: "No usable observations." };

  const marketCode = input.marketCode ?? "CZ";
  const segmentKey = input.segmentKey ?? "ALL";

  const previous = await prisma.valuationModelPerformanceSnapshot.findFirst({
    where: {
      modelRegistryId: input.modelRegistryId,
      marketCode,
      segmentKey,
    },
    orderBy: { computedAt: "desc" },
  });

  const regression = detectPerformanceRegression({
    mae: metrics.mae,
    previousMae: previous?.mae,
    mape: metrics.mape,
    previousMape: previous?.mape,
  });

  const row = await prisma.valuationModelPerformanceSnapshot.create({
    data: {
      modelRegistryId: input.modelRegistryId,
      marketCode,
      segmentKey,
      sampleSize: metrics.sampleSize,
      mae: metrics.mae,
      mape: metrics.mape,
      previousMae: previous?.mae ?? null,
      previousMape: previous?.mape ?? null,
      regressionAlert: regression.alert,
      regressionNote: regression.note,
    },
  });

  return {
    ok: true,
    snapshotId: row.id,
    regressionAlert: regression.alert,
  };
}

export async function listModelPerformance(input?: {
  take?: number;
}): Promise<{
  items: Array<{
    id: string;
    modelCode: string;
    marketCode: string;
    segmentKey: string;
    sampleSize: number;
    mae: number;
    mape: number;
    regressionAlert: boolean;
    regressionNote: string | null;
    computedAt: Date;
  }>;
  error: string | null;
}> {
  try {
    const rows = await prisma.valuationModelPerformanceSnapshot.findMany({
      orderBy: { computedAt: "desc" },
      take: Math.min(input?.take ?? 40, 100),
      include: { modelRegistry: { select: { code: true } } },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        modelCode: r.modelRegistry.code,
        marketCode: r.marketCode,
        segmentKey: r.segmentKey,
        sampleSize: r.sampleSize,
        mae: r.mae,
        mape: r.mape,
        regressionAlert: r.regressionAlert,
        regressionNote: r.regressionNote,
        computedAt: r.computedAt,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Performance list failed",
    };
  }
}

export async function overrideValuationEstimate(input: {
  valuationId: string;
  estimatedValue: number;
  reason: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Override reason is required." };
  }
  if (!(input.estimatedValue > 0)) {
    return { ok: false, error: "estimatedValue must be positive." };
  }

  const valuation = await prisma.valuation.findUnique({
    where: { id: input.valuationId },
    include: {
      comparables: { orderBy: { similarityScore: "desc" }, take: 12 },
    },
  });
  if (!valuation) return { ok: false, error: "Valuation not found." };

  const audit = buildAnalystOverrideAudit({
    valuationId: valuation.id,
    actorUserId: input.actorUserId,
    fieldKey: "estimatedValue",
    previousValue: valuation.estimatedValue,
    newValue: input.estimatedValue,
    reason: input.reason,
  });

  await prisma.$transaction([
    prisma.valuation.update({
      where: { id: valuation.id },
      data: {
        estimatedValue: input.estimatedValue,
        type: "ANALYST_ADJUSTED",
        status: "APPROVED",
      },
    }),
    prisma.valuationAdjustmentAudit.create({
      data: {
        valuationId: valuation.id,
        actorUserId: input.actorUserId,
        fieldKey: audit.fieldKey,
        previousValue: audit.previousValue as Prisma.InputJsonValue,
        newValue: audit.newValue as Prisma.InputJsonValue,
        reason: audit.reason,
      },
    }),
  ]);

  await writeAuditLog({
    action: "admin.valuation.override",
    entity: "Valuation",
    entityId: valuation.id,
    actorId: input.actorUserId,
    meta: {
      previousValue: valuation.estimatedValue,
      newValue: input.estimatedValue,
      reason: input.reason.trim().slice(0, 300),
      comparableCount: valuation.comparables.length,
    },
  });

  return { ok: true };
}

export async function getValuationForOps(valuationId: string) {
  try {
    const valuation = await prisma.valuation.findUnique({
      where: { id: valuationId },
      include: {
        comparables: { orderBy: { similarityScore: "desc" }, take: 20 },
        adjustmentAudits: { orderBy: { createdAt: "desc" }, take: 20 },
        property: {
          select: { id: true, slug: true, title: true, askingPrice: true },
        },
      },
    });
    return { valuation, error: null as string | null };
  } catch (err) {
    return {
      valuation: null,
      error: err instanceof Error ? err.message : "Load failed",
    };
  }
}

export async function listRecentValuations(input?: { take?: number }) {
  try {
    const rows = await prisma.valuation.findMany({
      orderBy: { updatedAt: "desc" },
      take: Math.min(input?.take ?? 30, 80),
      select: {
        id: true,
        status: true,
        type: true,
        modelVersion: true,
        estimatedValue: true,
        confidenceLevel: true,
        propertyId: true,
        property: { select: { title: true, slug: true, askingPrice: true } },
      },
    });
    return { items: rows, error: null as string | null };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "List failed",
    };
  }
}
