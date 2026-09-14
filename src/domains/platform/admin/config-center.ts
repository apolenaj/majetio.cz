import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import { sanitizeAuditMeta } from "@/domains/administration/audit/ops-audit-log";

/** Env keys shown as configured / not configured — never echo values. */
export const SECRET_ENV_KEYS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "S3_SECRET_ACCESS_KEY",
  "OPENAI_API_KEY",
] as const;

export type SecretEnvStatus = {
  key: string;
  configured: boolean;
};

/** Accept ProcessEnv or a plain record (tests) without unsafe casts. */
export function getSecretEnvStatuses(
  env: Readonly<Record<string, string | undefined>> = process.env,
): SecretEnvStatus[] {
  return SECRET_ENV_KEYS.map((key) => ({
    key,
    configured: Boolean(env[key]?.trim()),
  }));
}

/** Reject payloads that look like they try to store raw secrets. */
export function assertSafeConfigValue(
  key: string,
  value: unknown,
): { ok: true } | { ok: false; error: string } {
  const lower = key.toLowerCase();
  if (
    lower.includes("secret") ||
    lower.includes("password") ||
    lower.includes("api_key") ||
    lower.includes("apikey") ||
    lower.includes("token")
  ) {
    return {
      ok: false,
      error:
        "Secrets nesmí být v AppConfiguration. Použijte env a zobrazujte jen configured/not configured.",
    };
  }
  if (typeof value === "string" && value.length > 2000) {
    return { ok: false, error: "Config value too large." };
  }
  return { ok: true };
}

const appConfigJsonSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(appConfigJsonSchema),
    z.record(z.string(), appConfigJsonSchema),
  ]),
);

function parseAppConfigJson(
  value: unknown,
):
  | { ok: true; value: Prisma.InputJsonValue }
  | { ok: false; error: string } {
  const parsed = appConfigJsonSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, error: "Config value must be JSON-serializable." };
  }
  return { ok: true, value: parsed.data };
}

export async function listAppConfigurations(): Promise<{
  items: Array<{
    id: string;
    key: string;
    value: unknown;
    description: string | null;
    category: string;
    updatedAt: Date;
  }>;
  error: string | null;
}> {
  try {
    const rows = await prisma.appConfiguration.findMany({
      orderBy: { key: "asc" },
      take: 100,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        key: r.key,
        value: r.value,
        description: r.description,
        category: r.category,
        updatedAt: r.updatedAt,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Config list failed",
    };
  }
}

export async function upsertAppConfiguration(input: {
  key: string;
  value: unknown;
  description?: string;
  category?: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Reason required." };
  }
  const safe = assertSafeConfigValue(input.key, input.value);
  if (!safe.ok) return safe;

  const json = parseAppConfigJson(input.value);
  if (!json.ok) return json;

  const existing = await prisma.appConfiguration.findUnique({
    where: { key: input.key },
  });

  const row = await prisma.appConfiguration.upsert({
    where: { key: input.key },
    create: {
      key: input.key,
      value: json.value,
      description: input.description ?? null,
      category: input.category ?? "BUSINESS_LIMIT",
      updatedById: input.actorUserId,
    },
    update: {
      value: json.value,
      description: input.description ?? undefined,
      category: input.category ?? undefined,
      updatedById: input.actorUserId,
    },
  });

  await writeAuditLog({
    action: "admin.config.upsert",
    entity: "AppConfiguration",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: sanitizeAuditMeta({
      key: input.key,
      old: existing?.value ?? null,
      new: json.value,
      reason: input.reason.trim().slice(0, 300),
    }),
  });

  return { ok: true, id: row.id };
}
