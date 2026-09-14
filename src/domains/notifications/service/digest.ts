/**
 * Daily / weekly digest queue (BOD 141).
 * Groups: userId + savedSearchId + digest date bucket.
 * No spam send here — build payloads for the delivery job.
 */

import type { Prisma, SavedSearchAlertFrequency } from "@prisma/client";

import { prisma } from "@/lib/db";
import { sanitizeNotificationHref } from "./safe-href";
import { buildPropertyAlertDigestEmail } from "./alert-email-templates";
import { emitAlertTelemetry } from "../observability/telemetry";

export type DigestEventKind = "NEW_PROPERTY" | "PRICE_DROP" | "RELISTED";

export type DigestItemPayload = {
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  propertyCity: string | null;
  eventKind: DigestEventKind;
  matchedAt: string;
};

/**
 * Short digest headline counts — e.g. "5 nových, 2 poklesy, 1 znovu v nabídce".
 * Pure helper for body + e-mail (no financing fields).
 */
export function summarizeDigestItems(
  items: Array<{ eventKind: string }>,
): string {
  let neu = 0;
  let drops = 0;
  let relisted = 0;
  for (const i of items) {
    if (i.eventKind === "NEW_PROPERTY") neu += 1;
    else if (i.eventKind === "PRICE_DROP") drops += 1;
    else if (i.eventKind === "RELISTED") relisted += 1;
  }
  const parts: string[] = [];
  if (neu > 0) {
    parts.push(
      `${neu} ${neu === 1 ? "nová" : neu < 5 ? "nové" : "nových"}`,
    );
  }
  if (drops > 0) {
    parts.push(
      `${drops} ${drops === 1 ? "pokles" : drops < 5 ? "poklesy" : "poklesů"}`,
    );
  }
  if (relisted > 0) {
    parts.push(
      `${relisted} ${relisted === 1 ? "znovu v nabídce" : "znovu v nabídce"}`,
    );
  }
  return parts.join(", ");
}

function digestDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function digestWeekKey(d = new Date()): string {
  // ISO week: YYYY-Www
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function digestBatchKey(input: {
  frequency: "DAILY" | "WEEKLY";
  userId: string;
  savedSearchId: string;
  at?: Date;
}): string {
  const bucket =
    input.frequency === "WEEKLY"
      ? digestWeekKey(input.at)
      : digestDayKey(input.at);
  return `digest:${input.frequency.toLowerCase()}:${input.userId}:${input.savedSearchId}:${bucket}`;
}

/**
 * Append a match into a PENDING EMAIL digest alert (one row per user/search/bucket).
 */
export async function enqueueDigestItem(input: {
  userId: string;
  savedSearchId: string;
  searchName: string;
  frequency: SavedSearchAlertFrequency;
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  propertyCity: string | null;
  eventKind: DigestEventKind;
}): Promise<{ digestAlertId: string }> {
  const frequency =
    input.frequency === "WEEKLY" ? "WEEKLY" : ("DAILY" as const);
  const batchKey = digestBatchKey({
    frequency,
    userId: input.userId,
    savedSearchId: input.savedSearchId,
  });
  const dedupeKey = `${batchKey}:EMAIL`;
  const href = sanitizeNotificationHref("/ucet/ulozena-hledani");

  const item: DigestItemPayload = {
    propertyId: input.propertyId,
    propertySlug: input.propertySlug,
    propertyTitle: input.propertyTitle,
    propertyCity: input.propertyCity,
    eventKind: input.eventKind,
    matchedAt: new Date().toISOString(),
  };

  const existing = await prisma.propertyAlert.findUnique({
    where: {
      userId_dedupeKey: { userId: input.userId, dedupeKey },
    },
  });

  if (existing) {
    const meta =
      existing.meta && typeof existing.meta === "object" && !Array.isArray(existing.meta)
        ? (existing.meta as Record<string, unknown>)
        : {};
    const items = Array.isArray(meta.items)
      ? ([...meta.items] as DigestItemPayload[])
      : [];
    if (!items.some((i) => i.propertyId === item.propertyId)) {
      items.push(item);
    }
    const summary = summarizeDigestItems(items);
    await prisma.propertyAlert.update({
      where: { id: existing.id },
      data: {
        title: digestTitle(input.searchName, items.length, frequency, summary),
        body: digestBody(frequency, summary),
        meta: {
          ...meta,
          category: "transactional",
          digest: true,
          frequency,
          savedSearchId: input.savedSearchId,
          searchName: input.searchName,
          items,
          summary,
          // Explicitly forbid financing fields in digest meta
          financing: undefined,
          income: undefined,
          ltv: undefined,
        } as Prisma.InputJsonValue,
      },
    });
    return { digestAlertId: existing.id };
  }

  const summary = summarizeDigestItems([item]);
  const created = await prisma.propertyAlert.create({
    data: {
      userId: input.userId,
      propertyId: item.propertyId,
      type: "SAVED_SEARCH_MATCH",
      channel: "EMAIL",
      status: "PENDING",
      title: digestTitle(input.searchName, 1, frequency, summary),
      body: digestBody(frequency, summary),
      dedupeKey,
      batchKey,
      href,
      meta: {
        category: "transactional",
        digest: true,
        frequency,
        savedSearchId: input.savedSearchId,
        searchName: input.searchName,
        items: [item],
        summary,
      } as Prisma.InputJsonValue,
    },
  });

  return { digestAlertId: created.id };
}

function digestTitle(
  searchName: string,
  count: number,
  frequency: "DAILY" | "WEEKLY",
  summary: string,
): string {
  const period = frequency === "WEEKLY" ? "Týdenní" : "Denní";
  const detail = summary || String(count);
  return `${period} přehled: ${searchName} (${detail})`;
}

function digestBody(frequency: "DAILY" | "WEEKLY", summary: string): string {
  const period = frequency === "WEEKLY" ? "týdne" : "dne";
  if (!summary) {
    return `Žádné nové změny za ${period}.`;
  }
  return `${summary} za ${period}.`;
}

/**
 * Build digest e-mail payloads for PENDING digest alerts (no SendGrid call).
 */
export function buildDigestEmailFromAlert(input: {
  alert: {
    title: string;
    body: string | null;
    href: string | null;
    meta: unknown;
  };
  siteOrigin: string;
}): ReturnType<typeof buildPropertyAlertDigestEmail> | null {
  const meta =
    input.alert.meta &&
    typeof input.alert.meta === "object" &&
    !Array.isArray(input.alert.meta)
      ? (input.alert.meta as Record<string, unknown>)
      : {};
  if (!meta.digest) return null;

  const searchName =
    typeof meta.searchName === "string" ? meta.searchName : "Uložené hledání";
  const items = Array.isArray(meta.items)
    ? (meta.items as DigestItemPayload[])
    : [];

  const summary =
    typeof meta.summary === "string"
      ? meta.summary
      : summarizeDigestItems(items);

  return buildPropertyAlertDigestEmail({
    searchName,
    items: items.map((i) => ({
      title: i.propertyTitle,
      city: i.propertyCity,
      eventKind: i.eventKind,
      path: `/nemovitosti/${i.propertySlug}`,
    })),
    summary,
    ctaPath: input.alert.href ?? "/ucet/ulozena-hledani",
    siteOrigin: input.siteOrigin,
  });
}

/**
 * Mark digest EMAIL alerts as ready for the send worker (status stays PENDING
 * until email-delivery succeeds → SENT / FAILED).
 */
export async function listPendingDigestEmailAlerts(limit = 100) {
  return prisma.propertyAlert.findMany({
    where: {
      channel: "EMAIL",
      status: "PENDING",
      batchKey: { startsWith: "digest:" },
    },
    orderBy: { createdAt: "asc" },
    take: Math.min(200, Math.max(1, limit)),
  });
}

export async function runDigestJob(input: {
  frequency: "DAILY" | "WEEKLY";
  siteOrigin: string;
  /** Injected sender — defaults to no-op log (never spam). */
  send?: (toUserId: string, template: ReturnType<typeof buildPropertyAlertDigestEmail>) => Promise<{ ok: boolean }>;
}): Promise<{ processed: number; failed: number }> {
  const started = Date.now();
  const prefix = `digest:${input.frequency.toLowerCase()}:`;
  const alerts = await prisma.propertyAlert.findMany({
    where: {
      channel: "EMAIL",
      status: "PENDING",
      batchKey: { startsWith: prefix },
    },
    take: 100,
  });

  let processed = 0;
  let failed = 0;
  const send =
    input.send ??
    (async () => {
      // Default: do not send — prepare only (BOD: no spam)
      return { ok: true };
    });

  for (const alert of alerts) {
    const template = buildDigestEmailFromAlert({
      alert,
      siteOrigin: input.siteOrigin,
    });
    if (!template) {
      failed += 1;
      continue;
    }
    try {
      const result = await send(alert.userId, template);
      if (!result.ok) {
        await prisma.propertyAlert.update({
          where: { id: alert.id },
          data: { status: "FAILED" },
        });
        failed += 1;
        emitAlertTelemetry({
          type: "alert_failed",
          channel: "EMAIL",
          alertType: alert.type,
          code: "digest_send_failed",
          retryable: true,
        });
        continue;
      }
      await prisma.propertyAlert.update({
        where: { id: alert.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      processed += 1;
      emitAlertTelemetry({
        type: "alert_delivered",
        channel: "EMAIL",
        alertType: alert.type,
        status: "SENT",
      });
    } catch {
      failed += 1;
    }
  }

  emitAlertTelemetry({
    type: "alert_job_completed",
    job: input.frequency === "WEEKLY" ? "digest_weekly" : "digest_daily",
    status: failed > 0 && processed === 0 ? "FAILED" : failed > 0 ? "PARTIAL" : "SUCCEEDED",
    processed,
    failed,
    latencyMs: Date.now() - started,
  });

  return { processed, failed };
}
