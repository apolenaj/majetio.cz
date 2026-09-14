/**
 * Listing report / dispute workflow — creates moderation DQ issue + rate limits.
 */

import { createHash } from "node:crypto";

import { z } from "zod";

import { getRequestIp } from "@/lib/auth/audit";
import { rateLimitedMessage } from "@/lib/auth/constants";
import { getSessionUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

import {
  LISTING_REPORT_ISSUE_LABELS_CS,
  LISTING_REPORT_ISSUE_TYPES,
  type ListingReportIssueTypeCode,
} from "./constants";

export {
  LISTING_REPORT_ISSUE_LABELS_CS,
  LISTING_REPORT_ISSUE_TYPES,
  type ListingReportIssueTypeCode,
} from "./constants";

const reportInputSchema = z.object({
  propertyId: z.string().min(1).max(64),
  issueType: z.enum(LISTING_REPORT_ISSUE_TYPES),
  details: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type SubmitListingReportInput = z.infer<typeof reportInputSchema>;

export type SubmitListingReportResult =
  | { ok: true; reportId: string; issueId: string }
  | { ok: false; error: string; retryAfterSec?: number };

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_USER = 5;
const MAX_PER_IP = 8;
const MAX_PER_PROPERTY_PER_ACTOR = 2;

function hashIp(ip: string): string {
  return createHash("sha256").update(`listing-report:${ip}`).digest("hex");
}

function rateKey(parts: string[]): string {
  return `listing-report:${parts.join(":")}`.toLowerCase();
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

function ruleCodeForIssueType(issueType: ListingReportIssueTypeCode): string {
  return `USER_REPORT_${issueType}`;
}

function severityForIssueType(
  issueType: ListingReportIssueTypeCode,
): "CRITICAL" | "WARNING" | "INFO" {
  if (issueType === "PROHIBITED_CONTENT") return "CRITICAL";
  if (issueType === "MISLEADING" || issueType === "INCORRECT_DATA") {
    return "WARNING";
  }
  return "INFO";
}

/**
 * Submit a listing/data report. Creates ListingReport + DataQualityIssue (USER_REPORT).
 */
export async function submitListingReport(
  raw: unknown,
): Promise<SubmitListingReportResult> {
  const parsed = reportInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatný formulář hlášení." };
  }

  const { propertyId, issueType, details } = parsed.data;
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, slug: true, title: true },
  });
  if (!property) {
    return { ok: false, error: "Nemovitost nenalezena." };
  }

  const user = await getSessionUser();
  const ip = await getRequestIp();
  const ipHash = hashIp(ip);

  const actorKey = user?.id
    ? rateKey(["user", user.id])
    : rateKey(["ip", ipHash]);
  const actorMax = user?.id ? MAX_PER_USER : MAX_PER_IP;
  const propertyActorKey = rateKey([
    "property",
    propertyId,
    user?.id ?? ipHash,
  ]);

  const actorLimit = await consumeRateSlot(actorKey, actorMax);
  if (!actorLimit.ok) {
    return {
      ok: false,
      error: rateLimitedMessage(actorLimit.retryAfterSec),
      retryAfterSec: actorLimit.retryAfterSec,
    };
  }

  const propertyLimit = await consumeRateSlot(
    propertyActorKey,
    MAX_PER_PROPERTY_PER_ACTOR,
  );
  if (!propertyLimit.ok) {
    return {
      ok: false,
      error:
        "Tento inzerát jste už nedávno nahlásili. Děkujeme — tým to zkontroluje.",
      retryAfterSec: propertyLimit.retryAfterSec,
    };
  }

  const label = LISTING_REPORT_ISSUE_LABELS_CS[issueType];
  const message = `Uživatelské hlášení: ${label}`;
  const explanation = details
    ? `${label}. Detail: ${details}`
    : `Uživatel nahlásil problém typu „${label}“ u inzerátu ${property.slug}.`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const issue = await tx.dataQualityIssue.create({
        data: {
          propertyId: property.id,
          ruleCode: ruleCodeForIssueType(issueType),
          ruleVersion: "1",
          category: "USER_REPORT",
          severity: severityForIssueType(issueType),
          message,
          explanation,
          field: null,
          status: "OPEN",
          meta: {
            source: "listing_report",
            issueType,
            propertySlug: property.slug,
            reporterUserId: user?.id ?? null,
          },
        },
        select: { id: true },
      });

      const report = await tx.listingReport.create({
        data: {
          propertyId: property.id,
          reporterUserId: user?.id ?? null,
          reporterIpHash: ipHash,
          issueType,
          details: details ?? null,
          status: "OPEN",
          dataQualityIssueId: issue.id,
          meta: {
            propertySlug: property.slug,
            propertyTitle: property.title,
          },
        },
        select: { id: true },
      });

      return { reportId: report.id, issueId: issue.id };
    });

    return { ok: true, ...result };
  } catch (err) {
    console.error("submitListingReport failed", err);
    return { ok: false, error: "Hlášení se nepodařilo odeslat. Zkuste to znovu." };
  }
}
