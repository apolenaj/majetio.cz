/**
 * Public non-binding property audit inquiry → Lead(PROPERTY_AUDIT).
 */

import { createHash, randomBytes } from "node:crypto";

import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { applyLeadRouting } from "@/domains/crm/pipeline";
import { getRequestIp } from "@/lib/auth/audit";
import { rateLimitedMessage } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { assertSafeOutboundUrl } from "@/lib/security/ssrf";

const PURPOSE_VALUES = [
  "bydleni",
  "investice",
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
    propertyId: z.string().trim().min(1).max(64).optional(),
    askingPrice: z.coerce.number().positive().max(1e12).optional().nullable(),
    currency: z.string().trim().min(3).max(3).optional(),
    transactionType: z.enum(["SALE", "RENT"]).optional(),
    title: z.string().trim().max(200).optional(),
    layout: z.string().trim().max(40).optional(),
    usableArea: z.coerce.number().positive().max(1e6).optional().nullable(),
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
  investice: "Investice k pronájmu",
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

  let propertySnapshot: Record<string, unknown> | null = null;
  let linkedPropertyId: string | null = null;
  if (data.propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        visibility: true,
        isDemo: true,
        transactionType: true,
        propertyType: true,
        askingPrice: true,
        currency: true,
        publicCity: true,
        publicDistrict: true,
        publicLabel: true,
        layout: true,
        usableArea: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
    if (!property || property.isDemo) {
      return {
        ok: false,
        error:
          "Vybraná nabídka není dostupná pro placenou / poptávkovou analýzu. Zadejte vlastní skutečnou nemovitost.",
      };
    }
    if (property.status !== "ACTIVE" || property.visibility !== "PUBLIC") {
      return {
        ok: false,
        error: "Nabídka už není veřejně dostupná. Obnovte stránku nebo zadejte aktuální odkaz.",
      };
    }
    linkedPropertyId = property.id;
    propertySnapshot = {
      capturedAt: new Date().toISOString(),
      propertyId: property.id,
      slug: property.slug,
      title: property.title,
      transactionType: property.transactionType,
      propertyType: property.propertyType,
      askingPrice: property.askingPrice,
      currency: property.currency,
      locality:
        property.publicLabel ||
        [property.publicDistrict, property.publicCity].filter(Boolean).join(", "),
      layout: property.layout,
      usableArea: property.usableArea,
      publishedAt: property.publishedAt?.toISOString() ?? null,
      listingUpdatedAt: property.updatedAt.toISOString(),
      formAskingPrice: data.askingPrice ?? null,
      priceChangedSinceCapture:
        data.askingPrice != null &&
        property.askingPrice != null &&
        data.askingPrice !== property.askingPrice,
    };
  }

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
        propertyId: linkedPropertyId,
        source: linkedPropertyId
          ? "property_detail_analysis_offer"
          : "homepage_posoudit",
        correlationId,
        idempotencyKey,
        marketCode: "CZ",
        countryCode: "CZ",
        currency: data.currency?.toUpperCase() || "CZK",
        retentionExpiresAt,
        payload: {
          kind: "property_audit_inquiry",
          productKey: "deep_analysis",
          nonBinding: true,
          listingUrl,
          propertyType,
          locality,
          purpose: data.purpose,
          purposeLabel: PURPOSE_LABELS[data.purpose],
          note,
          caseStudySlug: data.caseStudySlug ?? null,
          title: data.title ? sanitizePlainText(data.title, 200) : null,
          transactionType: data.transactionType ?? null,
          askingPrice: data.askingPrice ?? null,
          layout: data.layout ?? null,
          usableArea: data.usableArea ?? null,
          propertySnapshot: propertySnapshot as Prisma.InputJsonValue | null,
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
