/**
 * Server-action mutation wrapper — every admin mutation must check permission (240–249).
 */

import { z, type ZodType } from "zod";

import { AuthError } from "@/lib/auth/guards";
import { requirePermission } from "@/domains/administration/rbac/guards";
import type { PermissionKey } from "@/domains/administration/rbac/permissions";
import type { SensitivePermissionKey } from "@/domains/administration/rbac/permissions";
import {
  assertSensitiveAction,
  SensitiveActionError,
} from "@/domains/administration/rbac/sensitive";

export type AdminMutationActor = {
  id: string;
  role: string;
};

export async function withAdminMutation<TInput, TResult>(input: {
  permission: PermissionKey;
  schema: ZodType<TInput>;
  raw: unknown;
  /** When set, runs sensitive step-up before handler. */
  sensitive?: {
    reason: string;
    confirmToken: string;
    entity: string;
    entityId?: string;
  };
  handler: (ctx: {
    actor: AdminMutationActor;
    data: TInput;
  }) => Promise<TResult>;
}): Promise<TResult | { ok: false; error: string }> {
  try {
    const user = await requirePermission(input.permission);
    const data = input.schema.parse(input.raw);

    if (input.sensitive) {
      await assertSensitiveAction({
        actorId: user.id,
        actorRole: user.role,
        permission: input.permission as SensitivePermissionKey,
        reason: input.sensitive.reason,
        confirmToken: input.sensitive.confirmToken,
        entity: input.sensitive.entity,
        entityId: input.sensitive.entityId,
      });
    }

    return await input.handler({
      actor: { id: user.id, role: user.role },
      data,
    });
  } catch (err) {
    if (err instanceof AuthError || err instanceof SensitiveActionError) {
      return { ok: false, error: err.message };
    }
    if (err instanceof z.ZodError) {
      return { ok: false, error: "Neplatné vstupní údaje." };
    }
    throw err;
  }
}
