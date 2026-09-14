/**
 * E-mail delivery for PropertyAlert PENDING rows (BOD 142).
 * Retries must NOT recreate in-app Notification rows — only update EMAIL alert status.
 * Prompt 20.6: batch user lookup (no N+1); max attempts; permanent failures → SUPPRESSED.
 */

import { prisma } from "@/lib/db";
import { logEmailInDev, type EmailTemplate } from "@/lib/email/templates";
import {
  buildPropertyAlertInstantEmail,
  buildPropertyAlertDigestEmail,
  assertNoFinancingPayload,
} from "./alert-email-templates";
import { buildDigestEmailFromAlert } from "./digest";
import { emitAlertTelemetry } from "../observability/telemetry";
import { sanitizeNotificationHref } from "./safe-href";

export type EmailSender = (input: {
  userId: string;
  toEmail: string;
  template: EmailTemplate;
}) => Promise<{ ok: boolean; error?: string; permanent?: boolean }>;

/** Default sender — logs in dev, no external provider (never spam). */
export const defaultAlertEmailSender: EmailSender = async ({
  toEmail,
  template,
}) => {
  logEmailInDev(template, toEmail);
  return { ok: true };
};

export const MAX_ALERT_EMAIL_ATTEMPTS = 5;

function readAttemptCount(meta: Record<string, unknown>): number {
  const n = meta.emailAttempts;
  return typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * Process PENDING EMAIL alerts. Failed sends → FAILED (retryable) until max attempts.
 * Permanent / exhausted → SUPPRESSED. Successful → SENT.
 * Never creates a second IN_APP notification.
 */
export async function processPendingAlertEmails(input: {
  siteOrigin: string;
  limit?: number;
  send?: EmailSender;
}): Promise<{ processed: number; failed: number; skipped: number }> {
  const started = Date.now();
  const send = input.send ?? defaultAlertEmailSender;
  const alerts = await prisma.propertyAlert.findMany({
    where: { channel: "EMAIL", status: { in: ["PENDING", "FAILED"] } },
    orderBy: { createdAt: "asc" },
    take: Math.min(100, Math.max(1, input.limit ?? 50)),
  });

  const userIds = [...new Set(alerts.map((a) => a.userId))];
  const users =
    userIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true },
        });
  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const alert of alerts) {
    const meta =
      alert.meta && typeof alert.meta === "object" && !Array.isArray(alert.meta)
        ? ({ ...(alert.meta as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : {};

    const attempts = readAttemptCount(meta);
    if (attempts >= MAX_ALERT_EMAIL_ATTEMPTS) {
      await prisma.propertyAlert.update({
        where: { id: alert.id },
        data: {
          status: "SUPPRESSED",
          meta: { ...meta, emailAttempts: attempts, emailDeadLetter: true },
        },
      });
      skipped += 1;
      continue;
    }

    if (!assertNoFinancingPayload(meta)) {
      await prisma.propertyAlert.update({
        where: { id: alert.id },
        data: { status: "SUPPRESSED" },
      });
      skipped += 1;
      emitAlertTelemetry({
        type: "alert_duplicate_suppressed",
        alertType: alert.type,
        reason: "fatigue",
      });
      continue;
    }

    let template: EmailTemplate | null = null;

    if (meta.digest) {
      template = buildDigestEmailFromAlert({
        alert,
        siteOrigin: input.siteOrigin,
      });
    } else {
      const path =
        sanitizeNotificationHref(alert.href) ??
        (typeof meta.href === "string"
          ? sanitizeNotificationHref(meta.href)
          : null) ??
        "/ucet/upozorneni";
      template = buildPropertyAlertInstantEmail({
        eventKind: String(meta.eventKind ?? alert.type),
        propertyTitle: alert.title,
        city: typeof meta.city === "string" ? meta.city : null,
        changeLine: alert.body ?? "Aktualizace uložené nabídky.",
        path,
        siteOrigin: input.siteOrigin,
      });
    }

    if (!template) {
      skipped += 1;
      continue;
    }

    const email = emailByUserId.get(alert.userId);
    if (!email) {
      skipped += 1;
      continue;
    }

    try {
      const result = await send({
        userId: alert.userId,
        toEmail: email,
        template,
      });
      if (!result.ok) {
        const nextAttempts = attempts + 1;
        const permanent =
          result.permanent === true || nextAttempts >= MAX_ALERT_EMAIL_ATTEMPTS;
        await prisma.propertyAlert.update({
          where: { id: alert.id },
          data: {
            status: permanent ? "SUPPRESSED" : "FAILED",
            meta: {
              ...meta,
              emailAttempts: nextAttempts,
              lastEmailError: result.error ?? "send_failed",
            },
          },
        });
        failed += 1;
        emitAlertTelemetry({
          type: "alert_failed",
          channel: "EMAIL",
          alertType: alert.type,
          code: result.error ?? "send_failed",
          retryable: !permanent,
        });
        continue;
      }

      await prisma.propertyAlert.update({
        where: { id: alert.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          meta: { ...meta, emailAttempts: attempts + 1 },
        },
      });
      // Intentionally do NOT create Notification / IN_APP here (BOD 142)
      processed += 1;
      emitAlertTelemetry({
        type: "alert_delivered",
        channel: "EMAIL",
        alertType: alert.type,
        status: "SENT",
      });
    } catch (err) {
      const nextAttempts = attempts + 1;
      const permanent = nextAttempts >= MAX_ALERT_EMAIL_ATTEMPTS;
      await prisma.propertyAlert.update({
        where: { id: alert.id },
        data: {
          status: permanent ? "SUPPRESSED" : "FAILED",
          meta: {
            ...meta,
            emailAttempts: nextAttempts,
            lastEmailError: err instanceof Error ? err.message : "exception",
          },
        },
      });
      failed += 1;
      emitAlertTelemetry({
        type: "alert_failed",
        channel: "EMAIL",
        alertType: alert.type,
        code: err instanceof Error ? err.name : "exception",
        retryable: !permanent,
      });
    }
  }

  emitAlertTelemetry({
    type: "alert_job_completed",
    job: "email_retry",
    status:
      failed > 0 && processed === 0
        ? "FAILED"
        : failed > 0
          ? "PARTIAL"
          : "SUCCEEDED",
    processed,
    failed,
    latencyMs: Date.now() - started,
  });

  return { processed, failed, skipped };
}

// Keep digest builder import used (tree-shake guard)
void buildPropertyAlertDigestEmail;
