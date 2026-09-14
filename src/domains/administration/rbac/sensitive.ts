/**
 * Sensitive action step-up (v1): reason + confirm token + audit trail.
 * Full password re-auth is deferred.
 */

import { writeAuditLog } from "@/lib/auth/audit";
import {
  isSensitivePermission,
  SENSITIVE_CONFIRM_TOKEN,
  SENSITIVE_REASON_MIN_LENGTH,
  type PermissionKey,
} from "@/domains/administration/rbac/permissions";
import { roleHasPermission } from "@/domains/administration/rbac/roles";

export {
  SENSITIVE_CONFIRM_TOKEN,
  SENSITIVE_REASON_MIN_LENGTH,
} from "@/domains/administration/rbac/permissions";

export class SensitiveActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SensitiveActionError";
  }
}

export function assertSensitiveActionInput(input: {
  reason: string;
  confirmToken: string;
}): void {
  const reason = input.reason.trim();
  if (reason.length < SENSITIVE_REASON_MIN_LENGTH) {
    throw new SensitiveActionError(
      `Uveďte důvod (min. ${SENSITIVE_REASON_MIN_LENGTH} znaků).`,
    );
  }
  if (input.confirmToken !== SENSITIVE_CONFIRM_TOKEN) {
    throw new SensitiveActionError(
      `Potvrďte akci tokenem ${SENSITIVE_CONFIRM_TOKEN}.`,
    );
  }
}

/**
 * Validate permission + step-up payload and append AuditLog.
 */
export async function assertSensitiveAction(input: {
  actorId: string;
  actorRole: string;
  permission: PermissionKey;
  reason: string;
  confirmToken: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  if (!isSensitivePermission(input.permission)) {
    throw new SensitiveActionError(
      `Permission ${input.permission} is not marked sensitive.`,
    );
  }
  if (!roleHasPermission(input.actorRole, input.permission)) {
    throw new SensitiveActionError(`Chybí oprávnění: ${input.permission}`);
  }
  assertSensitiveActionInput({
    reason: input.reason,
    confirmToken: input.confirmToken,
  });

  await writeAuditLog({
    action: `admin.sensitive.${input.permission}`,
    entity: input.entity,
    entityId: input.entityId,
    actorId: input.actorId,
    meta: {
      permission: input.permission,
      reason: input.reason.trim().slice(0, 500),
      stepUp: "reason_confirm",
      ...(input.meta ?? {}),
    },
  });
}
