/**
 * Structured security audit events — auth failures, webhook forgeries, rights.
 */

import { writeAuditLog } from "@/lib/auth/audit";
import { logger } from "@/lib/security/logger";

export async function auditWebhookForgery(input: {
  provider: "payments" | "hypotekajasne";
  reason: string;
  ip?: string | null;
}): Promise<void> {
  logger.warn("webhook_forgery_rejected", {
    provider: input.provider,
    reason: input.reason,
  });
  try {
    await writeAuditLog({
      action: "security.webhook.forgery",
      entity: "Webhook",
      entityId: input.provider,
      actorType: "ANONYMOUS",
      meta: {
        provider: input.provider,
        reason: input.reason.slice(0, 200),
        ip: input.ip ?? null,
      },
    });
  } catch {
    /* audit failure must not break webhook response */
  }
}

export async function auditAuthFailureBurst(input: {
  keyHint: string;
  reason: string;
}): Promise<void> {
  try {
    await writeAuditLog({
      action: "security.auth.failure_burst",
      entity: "Auth",
      entityId: input.keyHint.slice(0, 64),
      actorType: "ANONYMOUS",
      meta: { reason: input.reason.slice(0, 120) },
    });
  } catch {
    /* ignore */
  }
}

export async function auditAdminRightsChange(input: {
  actorId: string;
  targetUserId: string;
  beforeRole: string;
  afterRole: string;
}): Promise<void> {
  await writeAuditLog({
    action: "admin.user.role.change",
    entity: "User",
    entityId: input.targetUserId,
    actorId: input.actorId,
    beforeSummary: `role=${input.beforeRole}`,
    afterSummary: `role=${input.afterRole}`,
    meta: {
      beforeRole: input.beforeRole,
      afterRole: input.afterRole,
    },
  });
}
