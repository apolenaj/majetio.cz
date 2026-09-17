/**
 * Public non-binding property audit inquiry → Lead(PROPERTY_AUDIT).
 */

import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

import { applyLeadRouting } from "@/domains/crm/pipeline";
import { getRequestIp } from "@/lib/auth/audit";
import { rateLimitedMessage } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { assertSafeOutboundUrl } from "@/lib/security/ssrf";

const PURPOSE_VALUES = [
  "bydleni",
  "pronajem",
  "rekonstrukce",
  "jine",
] as const;

export const propertyAuditInquirySchema = z
  .object({
    listingUrl: z.string().trim().max(2_000).optional().or(z.literal("")),
    propertyType: z.string().trim().min(1).max(80),
    locality: z.string().trim().min(1).max(120),
    purpose: z.enum(PURPOSE_VALUES),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    note: z.string().trim().max(2_000).optional().or(z.literal("")),
    caseStudySlug: z
      .enum([
        "byt-dlouhodoby-pronajem",
        "dum-pred-rekonstrukci",
        "mensi-bytovy-dum",
      ])
      .optional(),
    /** Honeypot — bots fill this; humans leave empty. */
    companyWebsite: z.string().max(200).optional().default(""),
    consent: z.literal(true),
  })
  .strict();

export type PropertyAuditInquiryInput = z.infer<
  typeof propertyAuditInquirySchema
>;

export type PropertyAuditInquiryResult =
  | { ok: true; correlationId: string }
  | { ok: false; error: string; retryAfterSec?: number };

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 8;

function hashIp(ip: string): string {
  return createHash("sha256").update(`property-audit:${ip}`).digest("hex");
}

function rateKey(parts: string[]): string {
  return `property-audit:${parts.join(":")}`.toLowerCase();
}

function generateAuditCorrelationId(): string {
  return `pa_${randomBytes(16).toString("base64url")}`;
}

function buildIdempotencyKey(email: string, locality: string, purpose: string) {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(
      `property-audit|${email.toLowerCase()}|${locality}|${purpose}|${day}`,
    )
    .digest("hex");
}

async function consumeRateSlot(
  key: string,
  max: number,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const now = new Date();
  const row = await prisma.authRateLimit.findUnique({ where: { key } });

  if (row?.lockedUntil && row.lockedUntil > now) {
    return {
      ok: false,
      retryAfterSec: Math.ceil(
        (row.lockedUntil.getTime() - now.getTime()) / 1000,
      ),
    };
  }

  if (!row || now.getTime() - row.windowStart.getTime() > WINDOW_MS) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { key, failCount: 1, windowStart: now, lockedUntil: null },
      update: { failCount: 1, windowStart: now, lockedUntil: null },
    });
    return { ok: true };
  }

  const next = row.failCount + 1;
  if (next > max) {
    const lockedUntil = new Date(now.getTime() + WINDOW_MS);
    await prisma.authRateLimit.update({
      where: { key },
      data: { failCount: next, lockedUntil },
    });
    return {
      ok: false,
      retryAfterSec: Math.ceil(WINDOW_MS / 1000),
    };
  }

  await prisma.authRateLimit.update({
    where: { key },
    data: { failCount: next },
  });
  return { ok: true };
}

const PURPOSE_LABELS: Record<(typeof PURPOSE_VALUES)[number], string> = {
  bydleni: "Vlastní bydlení",
  pronajem: "Pronájem",
  rekonstrukce: "Rekonstrukce",
  jine: "Jiné",
};

/**
 * Persist a non-binding PROPERTY_AUDIT lead. Success only after DB write.
 */
export async function submitPropertyAuditInquiry(
  raw: unknown,
): Promise<PropertyAuditInquiryResult> {
  const parsed = propertyAuditInquirySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Zkontrolujte vyplněná pole a potvrďte souhlas se zpracováním.",
    };
  }

  const data = parsed.data;
  if (data.companyWebsite && data.companyWebsite.trim().length > 0) {
    // Silent success for bots — no DB write.
    return { ok: true, correlationId: generateAuditCorrelationId() };
  }

  const listingUrlRaw = data.listingUrl?.trim() ?? "";
  let listingUrl: string | null = null;
  if (listingUrlRaw) {
    const validated = assertSafeOutboundUrl(listingUrlRaw);
    if (!validated.ok) {
      return {
        ok: false,
        error:
          "Odkaz na inzerát není platný. Použijte veřejnou HTTPS adresu, nebo pole nechte prázdné.",
      };
    }
    listingUrl = validated.url.toString();
  }

  const email = data.email.trim().toLowerCase();
  const locality = sanitizePlainText(data.locality, 120);
  const propertyType = sanitizePlainText(data.propertyType, 80);
  const note = data.note ? sanitizePlainText(data.note, 2_000) : null;
  const phone = data.phone ? sanitizePlainText(data.phone, 40) : null;

  const ip = (await getRequestIp()) ?? "unknown";
  const emailLimit = await consumeRateSlot(rateKey(["email", email]), MAX_PER_EMAIL);
  if (!emailLimit.ok) {
    return {
      ok: false,
      error: rateLimitedMessage(emailLimit.retryAfterSec),
      retryAfterSec: emailLimit.retryAfterSec,
    };
  }
  const ipLimit = await consumeRateSlot(rateKey(["ip", hashIp(ip)]), MAX_PER_IP);
  if (!ipLimit.ok) {
    return {
      ok: false,
      error: rateLimitedMessage(ipLimit.retryAfterSec),
      retryAfterSec: ipLimit.retryAfterSec,
    };
  }

  const idempotencyKey = buildIdempotencyKey(email, locality, data.purpose);
  const existing = await prisma.lead.findUnique({
    where: { idempotencyKey },
    select: { correlationId: true },
  });
  if (existing) {
    return { ok: true, correlationId: existing.correlationId };
  }

  const correlationId = generateAuditCorrelationId();
  const retentionExpiresAt = new Date();
  retentionExpiresAt.setDate(retentionExpiresAt.getDate() + 365);

  try {
    const lead = await prisma.lead.create({
      data: {
        type: "PROPERTY_AUDIT",
        status: "NEW",
        email,
        phone: phone || null,
        source: "homepage_posoudit",
        correlationId,
        idempotencyKey,
        marketCode: "CZ",
        countryCode: "CZ",
        currency: "CZK",
        retentionExpiresAt,
        payload: {
          kind: "property_audit_inquiry",
          nonBinding: true,
          listingUrl,
          propertyType,
          locality,
          purpose: data.purpose,
          purposeLabel: PURPOSE_LABELS[data.purpose],
          note,
          caseStudySlug: data.caseStudySlug ?? null,
          submittedAt: new Date().toISOString(),
        },
      },
      select: { id: true, correlationId: true },
    });

    await applyLeadRouting({ leadId: lead.id });

    return { ok: true, correlationId: lead.correlationId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message.includes("Unique constraint") || message.includes("idempotency")) {
      const again = await prisma.lead.findUnique({
        where: { idempotencyKey },
        select: { correlationId: true },
      });
      if (again) return { ok: true, correlationId: again.correlationId };
    }
    return {
      ok: false,
      error:
        "Poptávku se nepodařilo uložit. Zkuste to prosím znovu za chvíli, nebo napište na kontaktní e-mail.",
    };
  }
}
