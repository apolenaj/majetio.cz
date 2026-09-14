/**
 * Audit log helpers — append-only, secret-safe (spec 132–138, 275–276, 280–281).
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export const AUDIT_ACTOR_TYPES = [
  "USER",
  "SYSTEM",
  "SERVICE",
  "ANONYMOUS",
] as const;

export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

/** Keys / substrings that must never appear in persisted audit payloads. */
const SECRET_KEY_PATTERN =
  /(password|passwd|secret|token|api[_-]?key|authorization|cookie|private[_-]?key|credential|bearer)/i;

const SECRET_VALUE_PATTERN =
  /\b(sk_live_|sk_test_|rk_live_|whsec_|Bearer\s+[A-Za-z0-9._\-]+)/i;

export type OpsAuditWriteInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  actorType?: AuditActorType;
  reason?: string | null;
  beforeSummary?: string | null;
  afterSummary?: string | null;
  correlationId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown> | null;
};

export function assertNoSecretsInText(
  label: string,
  value: string | null | undefined,
): void {
  if (!value) return;
  if (SECRET_VALUE_PATTERN.test(value) || SECRET_KEY_PATTERN.test(value)) {
    throw new Error(
      `AuditLog refuses secret-like content in ${label}. Redact before write.`,
    );
  }
}

/**
 * Deep-sanitize plain objects for AuditLog.meta.
 * Drops secret-named keys and redacts secret-like string values.
 */
export function sanitizeAuditMeta(
  input: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (!input) return undefined;

  const walk = (value: unknown, depth: number): unknown => {
    if (depth > 8) return "[truncated]";
    if (value == null) return value;
    if (typeof value === "string") {
      if (SECRET_VALUE_PATTERN.test(value)) return "[REDACTED]";
      if (value.length > 2000) return `${value.slice(0, 2000)}…`;
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) {
      return value.map((v) => walk(v, depth + 1));
    }
    if (typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (SECRET_KEY_PATTERN.test(k)) {
          out[k] = "[REDACTED]";
          continue;
        }
        out[k] = walk(v, depth + 1);
      }
      return out;
    }
    return String(value);
  };

  return walk(input, 0) as Prisma.InputJsonValue;
}

export function truncateSummary(
  value: string | null | undefined,
  max = 2000,
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/**
 * Append-only insert into AuditLog.
 * Never updates/deletes — DB triggers also enforce this.
 */
export async function writeOpsAuditLog(
  input: OpsAuditWriteInput,
): Promise<{ id: string }> {
  assertNoSecretsInText("reason", input.reason ?? undefined);
  assertNoSecretsInText("beforeSummary", input.beforeSummary ?? undefined);
  assertNoSecretsInText("afterSummary", input.afterSummary ?? undefined);

  const entityType = input.entityType.trim();
  if (!entityType) {
    throw new Error("entityType is required.");
  }
  if (!input.action.trim()) {
    throw new Error("action is required.");
  }

  const row = await prisma.auditLog.create({
    data: {
      action: input.action.trim(),
      entity: entityType,
      entityType,
      entityId: input.entityId ?? undefined,
      actorId: input.actorId ?? undefined,
      actorType: input.actorType ?? (input.actorId ? "USER" : "SYSTEM"),
      reason: truncateSummary(input.reason, 2000),
      beforeSummary: truncateSummary(input.beforeSummary, 2000),
      afterSummary: truncateSummary(input.afterSummary, 2000),
      correlationId: input.correlationId ?? undefined,
      ip: input.ip ?? undefined,
      userAgent: input.userAgent?.slice(0, 500) ?? undefined,
      meta: sanitizeAuditMeta(input.meta ?? undefined),
    },
    select: { id: true },
  });

  return row;
}

/** Explicitly forbidden — AuditLog is append-only. */
export async function updateAuditLog(): Promise<never> {
  throw new Error("AuditLog is append-only. Updates are forbidden.");
}

export async function deleteAuditLog(): Promise<never> {
  throw new Error("AuditLog is append-only. Deletes are forbidden.");
}
