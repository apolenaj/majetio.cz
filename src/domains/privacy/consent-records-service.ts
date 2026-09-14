import "server-only";

import { createHash, randomBytes } from "crypto";
import type { ConsentPurpose, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import {
  assertPartnerShareConsent,
  type ConsentRecordInput,
} from "@/domains/privacy/consent-record";
import type { CookieConsentState } from "@/domains/privacy/cookie-consent";
import { COOKIE_POLICY_VERSION } from "@/domains/privacy/cookie-consent";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function persistConsentRecord(
  input: ConsentRecordInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const gate = assertPartnerShareConsent({
    purpose: input.purpose,
    recipient: input.recipient,
    sharedScope: input.sharedScope,
  });
  if (!gate.ok) return gate;

  if (!input.userId && !input.visitorId) {
    return { ok: false, error: "ConsentRecord vyžaduje userId nebo visitorId." };
  }

  const now = new Date();
  const row = await prisma.consentRecord.create({
    data: {
      userId: input.userId ?? undefined,
      visitorId: input.visitorId ?? undefined,
      purpose: input.purpose as ConsentPurpose,
      recipient: input.recipient ?? null,
      sharedScope: (input.sharedScope ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      version: input.version,
      granted: input.granted,
      grantedAt: input.granted ? now : null,
      revokedAt: input.granted ? null : now,
      legalDocVersion: input.legalDocVersion ?? null,
      metadata: (input.metadata ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
    },
  });

  await writeAuditLog({
    action: input.granted ? "consent.grant" : "consent.revoke",
    entity: "ConsentRecord",
    entityId: row.id,
    actorId: input.userId ?? null,
    actorType: input.userId ? "USER" : "ANONYMOUS",
    meta: {
      purpose: input.purpose,
      recipient: input.recipient ?? null,
      version: input.version,
    },
  });

  return { ok: true, id: row.id };
}

export async function syncCookieConsentRecords(input: {
  userId?: string | null;
  visitorId: string;
  state: CookieConsentState;
  source: string;
}): Promise<void> {
  const pairs: Array<{
    purpose: ConsentPurpose;
    granted: boolean;
  }> = [
    { purpose: "COOKIE_NECESSARY", granted: true },
    { purpose: "COOKIE_PREFERENCES", granted: input.state.preferences },
    { purpose: "COOKIE_ANALYTICS", granted: input.state.analytics },
    { purpose: "COOKIE_MARKETING", granted: input.state.marketing },
  ];

  for (const p of pairs) {
    await persistConsentRecord({
      userId: input.userId,
      visitorId: input.visitorId,
      purpose: p.purpose,
      version: COOKIE_POLICY_VERSION,
      granted: p.granted,
      legalDocVersion: COOKIE_POLICY_VERSION,
      metadata: { source: input.source },
    });
  }
}

export async function listUserConsentRecords(userId: string) {
  return prisma.consentRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function withdrawConsentRecord(input: {
  userId: string;
  recordId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.consentRecord.findFirst({
    where: { id: input.recordId, userId: input.userId },
  });
  if (!row) return { ok: false, error: "Záznam souhlasu nenalezen." };
  if (row.purpose === "COOKIE_NECESSARY") {
    return { ok: false, error: "Nezbytné cookies nelze odvolat." };
  }
  if (row.purpose === "LEGAL_TERMS" || row.purpose === "LEGAL_PRIVACY") {
    return {
      ok: false,
      error:
        "Smluvní souhlasy nelze odvolat bez ukončení účtu — použijte žádost o výmaz.",
    };
  }

  await prisma.consentRecord.create({
    data: {
      userId: input.userId,
      visitorId: row.visitorId,
      purpose: row.purpose,
      recipient: row.recipient,
      sharedScope: row.sharedScope ?? undefined,
      version: row.version,
      granted: false,
      grantedAt: null,
      revokedAt: new Date(),
      legalDocVersion: row.legalDocVersion,
      metadata: {
        source: "ucet/soukromi",
        withdrawsId: row.id,
      },
    },
  });

  await writeAuditLog({
    action: "consent.revoke",
    entity: "ConsentRecord",
    entityId: row.id,
    actorId: input.userId,
    meta: { purpose: row.purpose, recipient: row.recipient },
  });

  return { ok: true };
}

const EXPORT_TTL_MS = 15 * 60 * 1000;

export async function createPrivacyExportToken(input: {
  userId: string;
  format: "json" | "csv";
}): Promise<
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; error: string }
> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + EXPORT_TTL_MS);

  await prisma.privacyExportToken.create({
    data: {
      userId: input.userId,
      tokenHash: sha256(token),
      format: input.format,
      status: "READY",
      expiresAt,
    },
  });

  await writeAuditLog({
    action: "account.export.request",
    entity: "PrivacyExportToken",
    entityId: input.userId,
    actorId: input.userId,
    meta: { format: input.format, ttlMinutes: 15 },
  });

  return { ok: true, token, expiresAt: expiresAt.toISOString() };
}

export async function consumePrivacyExportToken(input: {
  userId: string;
  token: string;
}): Promise<
  | { ok: true; format: "json" | "csv" }
  | { ok: false; error: string }
> {
  const tokenHash = sha256(input.token);
  const row = await prisma.privacyExportToken.findUnique({
    where: { tokenHash },
  });
  if (!row || row.userId !== input.userId) {
    return { ok: false, error: "Neplatný export token." };
  }
  if (row.status !== "READY") {
    return { ok: false, error: "Export už byl použit nebo vypršel." };
  }
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.privacyExportToken.update({
      where: { id: row.id },
      data: { status: "EXPIRED" },
    });
    return { ok: false, error: "Export vypršel — požádejte znovu." };
  }

  await prisma.privacyExportToken.update({
    where: { id: row.id },
    data: { status: "CONSUMED", consumedAt: new Date() },
  });

  await writeAuditLog({
    action: "account.export.download",
    entity: "PrivacyExportToken",
    entityId: row.id,
    actorId: input.userId,
    meta: { format: row.format },
  });

  return {
    ok: true,
    format: row.format === "csv" ? "csv" : "json",
  };
}

export async function requestAccountDeletionSoft(input: {
  userId: string;
  confirmEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, deletionRequestedAt: true },
  });
  if (!user) return { ok: false, error: "Účet nenalezen." };
  if (
    input.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()
  ) {
    return {
      ok: false,
      error: "Pro potvrzení zadejte přesně svůj současný e-mail.",
    };
  }
  if (user.deletionRequestedAt) {
    return { ok: true };
  }

  const { softRequestAccountErasure } = await import(
    "@/lib/security/privacy-data"
  );
  const erased = await softRequestAccountErasure({
    userId: input.userId,
    actorId: input.userId,
    reason: "user_privacy_center",
  });
  if (!erased.ok) {
    return { ok: false, error: erased.error };
  }

  return { ok: true };
}
