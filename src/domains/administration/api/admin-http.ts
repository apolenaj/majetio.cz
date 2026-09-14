/**
 * Admin API HTTP helpers — permission gate, zod validation, session audit (240–249).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z, type ZodType } from "zod";

import { AuthError } from "@/lib/auth/guards";
import { getRequestIp } from "@/lib/auth/audit";
import { requirePermission } from "@/domains/administration/rbac/guards";
import type { PermissionKey } from "@/domains/administration/rbac/permissions";
import { writeOpsAuditLog } from "@/domains/administration/audit/ops-audit-log";
import { SensitiveActionError } from "@/domains/administration/rbac/sensitive";
import {
  AdminApiError,
} from "@/domains/administration/api/admin-api-guards";
import { logger, redactErrorForClient } from "@/lib/security/logger";
import {
  InvalidJsonError,
  PayloadTooLargeError,
  TooManyFieldsError,
  parseLimitedJsonBody,
  MAX_ADMIN_JSON_BODY_BYTES,
} from "@/lib/security/validate";

export {
  AdminApiError,
  assertActorIsSessionUser,
  rejectUniversalDbEditor,
} from "@/domains/administration/api/admin-api-guards";

export type AdminApiActor = {
  id: string;
  role: string;
  email?: string | null;
};

export function adminJson<T>(
  data: T,
  init?: { status?: number },
): NextResponse {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function adminErrorResponse(err: unknown): NextResponse {
  if (err instanceof AdminApiError) {
    return adminJson(
      { ok: false as const, error: err.message, code: err.code },
      { status: err.status },
    );
  }
  if (err instanceof AuthError) {
    return adminJson(
      { ok: false as const, error: err.message, code: "forbidden" },
      { status: 403 },
    );
  }
  if (err instanceof SensitiveActionError) {
    return adminJson(
      { ok: false as const, error: err.message, code: "step_up_required" },
      { status: 403 },
    );
  }
  if (err instanceof z.ZodError) {
    return adminJson(
      {
        ok: false as const,
        error: "Validation failed",
        code: "validation_error",
        details:
          process.env.NODE_ENV === "production" ? undefined : err.flatten(),
      },
      { status: 400 },
    );
  }
  if (
    err instanceof PayloadTooLargeError ||
    err instanceof InvalidJsonError ||
    err instanceof TooManyFieldsError
  ) {
    return adminJson(
      { ok: false as const, error: err.message, code: "bad_request" },
      { status: err.status },
    );
  }

  logger.error("admin_api_unhandled", {
    name: err instanceof Error ? err.name : "unknown",
  });

  const safe = redactErrorForClient(err);
  return adminJson(
    { ok: false as const, error: safe.message, code: "internal_error" },
    { status: 500 },
  );
}

/**
 * Require permission for an admin API route. Returns actor on success.
 */
export async function requireAdminApiPermission(
  permission: PermissionKey,
): Promise<AdminApiActor> {
  const user = await requirePermission(permission);
  return {
    id: user.id,
    role: user.role,
    email: "email" in user ? (user.email as string | null | undefined) : null,
  };
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  return parseLimitedJsonBody(request, schema, MAX_ADMIN_JSON_BODY_BYTES);
}

export function parseSearchParams<T>(
  request: NextRequest | Request,
  schema: ZodType<T>,
): T {
  const url = new URL(request.url);
  const obj: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  return schema.parse(obj);
}

/**
 * Session audit for admin API access (182–184).
 * Does not log request bodies (may contain PII/secrets).
 */
export async function auditAdminApiAccess(input: {
  actor: AdminApiActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  request: Request;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const ip = await getRequestIp().catch(() => "unknown");
  const ua = input.request.headers.get("user-agent")?.slice(0, 500) ?? null;
  await writeOpsAuditLog({
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    actorId: input.actor.id,
    actorType: "USER",
    ip,
    userAgent: ua,
    meta: {
      path: new URL(input.request.url).pathname,
      method: input.request.method,
      ...(input.meta ?? {}),
    },
  });
}
