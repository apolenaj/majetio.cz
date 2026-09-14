import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  adminErrorResponse,
  adminJson,
  auditAdminApiAccess,
  parseJsonBody,
  requireAdminApiPermission,
} from "@/domains/administration/api/admin-http";
import {
  assertSensitiveAction,
  SENSITIVE_CONFIRM_TOKEN,
} from "@/domains/administration";
import {
  compareValuationModels,
  rollbackValuationModel,
  setModelShadowMode,
  transitionValuationModel,
} from "@/domains/valuation/admin/control-center";
import { MODEL_LIFECYCLE } from "@/domains/valuation/admin/metrics";

export const dynamic = "force-dynamic";

const transitionSchema = z
  .object({
    action: z.literal("transition"),
    nextStatus: z.enum(MODEL_LIFECYCLE),
    reason: z.string().trim().min(8).max(500),
    confirmToken: z.string().optional(),
  })
  .strict();

const shadowSchema = z
  .object({
    action: z.literal("shadow"),
    shadowMode: z.boolean(),
    reason: z.string().trim().min(8).max(500),
  })
  .strict();

const rollbackSchema = z
  .object({
    action: z.literal("rollback"),
    reason: z.string().trim().min(12).max(500),
    confirmToken: z.string(),
  })
  .strict();

const compareSchema = z
  .object({
    action: z.literal("compare"),
    otherModelId: z.string().min(1),
  })
  .strict();

const bodySchema = z.discriminatedUnion("action", [
  transitionSchema,
  shadowSchema,
  rollbackSchema,
  compareSchema,
]);

/** POST /api/admin/models/[id]/governance */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await parseJsonBody(request, bodySchema);

    if (body.action === "compare") {
      const actor = await requireAdminApiPermission("analytics.models.read");
      const result = await compareValuationModels({
        leftModelId: id,
        rightModelId: body.otherModelId,
      });
      await auditAdminApiAccess({
        actor,
        action: "ops.api.model.compare",
        entityType: "ValuationModelRegistry",
        entityId: id,
        request,
      });
      if (!result.ok) {
        return adminJson(
          { ok: false as const, error: result.error },
          { status: 404 },
        );
      }
      return adminJson({ ok: true as const, comparison: result.comparison });
    }

    if (body.action === "shadow") {
      const actor = await requireAdminApiPermission("analytics.models.write");
      const result = await setModelShadowMode({
        modelId: id,
        shadowMode: body.shadowMode,
        actorUserId: actor.id,
        reason: body.reason,
      });
      if (!result.ok) {
        return adminJson(
          { ok: false as const, error: result.error },
          { status: 400 },
        );
      }
      return adminJson({ ok: true as const });
    }

    if (body.action === "rollback") {
      const actor = await requireAdminApiPermission("analytics.models.approve");
      await assertSensitiveAction({
        actorId: actor.id,
        actorRole: actor.role,
        permission: "analytics.models.approve",
        reason: body.reason,
        confirmToken: body.confirmToken || SENSITIVE_CONFIRM_TOKEN,
        entity: "ValuationModelRegistry",
        entityId: id,
      });
      const result = await rollbackValuationModel({
        modelId: id,
        actorUserId: actor.id,
        reason: body.reason,
      });
      if (!result.ok) {
        return adminJson(
          { ok: false as const, error: result.error },
          { status: 400 },
        );
      }
      return adminJson({
        ok: true as const,
        restoredModelId: result.restoredModelId,
      });
    }

    // transition
    const needsApprove =
      body.nextStatus === "APPROVED" || body.nextStatus === "ACTIVE";
    const actor = await requireAdminApiPermission(
      needsApprove ? "analytics.models.approve" : "analytics.models.write",
    );
    if (needsApprove) {
      await assertSensitiveAction({
        actorId: actor.id,
        actorRole: actor.role,
        permission: "analytics.models.approve",
        reason: body.reason,
        confirmToken: body.confirmToken || SENSITIVE_CONFIRM_TOKEN,
        entity: "ValuationModelRegistry",
        entityId: id,
      });
    }

    const result = await transitionValuationModel({
      modelId: id,
      nextStatus: body.nextStatus,
      actorUserId: actor.id,
      reason: body.reason,
    });
    if (!result.ok) {
      return adminJson(
        { ok: false as const, error: result.error },
        { status: 400 },
      );
    }

    await auditAdminApiAccess({
      actor,
      action: "ops.api.model.transition",
      entityType: "ValuationModelRegistry",
      entityId: id,
      request,
      meta: { nextStatus: body.nextStatus },
    });

    return adminJson({ ok: true as const });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
