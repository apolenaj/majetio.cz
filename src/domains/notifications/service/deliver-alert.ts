/**
 * Deliver PropertyAlert to inbox (+ optional Notification mirror).
 * Transactional vs marketing: property alerts are transactional;
 * EMAIL requires transactional email pref — never marketing consent.
 */

import type {
  NotificationChannel,
  Prisma,
  PropertyAlertType,
} from "@prisma/client";

import { propertyAlertConfig } from "@/config/property-alerts";
import { prisma } from "@/lib/db";
import { shouldSuppressForFatigue } from "./alert-fatigue";
import { normalizeAlertType } from "./alert-copy";
import { enqueuePropertyAlertEvent } from "./property-alerts";
import { sanitizeNotificationHref } from "./safe-href";
import { emitAlertTelemetry } from "../observability/telemetry";

export type DeliverPropertyAlertInput = {
  userId: string;
  propertyId?: string | null;
  type: PropertyAlertType;
  title: string;
  body: string;
  href?: string | null;
  dedupeKey: string;
  batchKey?: string | null;
  meta?: Record<string, unknown>;
  /** Default IN_APP; EMAIL only when transactional email enabled. */
  preferEmail?: boolean;
};

export type DeliverPropertyAlertResult =
  | {
      ok: true;
      alertId: string;
      status: "SENT" | "PENDING" | "SUPPRESSED" | "DEDUPED";
    }
  | { ok: false; error: string };

async function loadChannelPrefs(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      notifyTransactionalEmail: true,
      notifyTransactionalInApp: true,
      notifyMarketingEmail: true,
      notifyMarketingInApp: true,
    },
  });
  return {
    transactionalEmail: profile?.notifyTransactionalEmail ?? true,
    transactionalInApp: profile?.notifyTransactionalInApp ?? true,
    marketingEmail: profile?.notifyMarketingEmail ?? false,
    marketingInApp: profile?.notifyMarketingInApp ?? false,
  };
}

/**
 * Resolve delivery channels. Property alerts are always transactional —
 * marketing prefs are never consulted.
 */
export function resolveTransactionalChannels(
  prefs: {
    transactionalEmail: boolean;
    transactionalInApp: boolean;
  },
  preferEmail: boolean,
): NotificationChannel[] {
  const channels: NotificationChannel[] = [];
  if (prefs.transactionalInApp) channels.push("IN_APP");
  if (preferEmail && prefs.transactionalEmail) channels.push("EMAIL");
  return channels.filter((c) =>
    (propertyAlertConfig.channels as readonly string[]).includes(c),
  );
}

export async function deliverPropertyAlert(
  input: DeliverPropertyAlertInput,
): Promise<DeliverPropertyAlertResult> {
  const type = normalizeAlertType(input.type);
  const prefs = await loadChannelPrefs(input.userId);
  const channels = resolveTransactionalChannels(prefs, Boolean(input.preferEmail));
  const href = sanitizeNotificationHref(input.href);

  if (channels.length === 0) {
    emitAlertTelemetry({
      type: "alert_duplicate_suppressed",
      alertType: type,
      reason: "fatigue",
    });
    return { ok: true, alertId: "", status: "SUPPRESSED" };
  }

  const fatigue = await shouldSuppressForFatigue({
    userId: input.userId,
    propertyId: input.propertyId,
  });

  const event = await enqueuePropertyAlertEvent(prisma, {
    userId: input.userId,
    propertyId: input.propertyId,
    alertType: type,
    payload: {
      title: input.title,
      body: input.body,
      href,
      category: "transactional",
      ...input.meta,
    },
  });

  let firstId = "";
  let lastStatus: DeliverPropertyAlertResult =
    { ok: true, alertId: "", status: "SENT" };

  for (const channel of channels) {
    const dedupeKey = `${input.dedupeKey}:${channel}`;
    const existing = await prisma.propertyAlert.findUnique({
      where: {
        userId_dedupeKey: { userId: input.userId, dedupeKey },
      },
      select: { id: true },
    });
    if (existing) {
      lastStatus = { ok: true, alertId: existing.id, status: "DEDUPED" };
      if (!firstId) firstId = existing.id;
      emitAlertTelemetry({
        type: "alert_duplicate_suppressed",
        alertType: type,
        reason: "dedupe_key",
      });
      continue;
    }

    const suppressed = fatigue.suppress;
    const now = new Date();
    const status = suppressed
      ? "SUPPRESSED"
      : channel === "IN_APP"
        ? "SENT"
        : "PENDING";

    try {
      const alert = await prisma.propertyAlert.create({
        data: {
          userId: input.userId,
          propertyId: input.propertyId ?? null,
          type,
          eventId: event.id,
          channel,
          status,
          title: input.title,
          body: input.body,
          dedupeKey,
          batchKey: input.batchKey ?? null,
          href,
          meta: {
            category: "transactional",
            fatigueReason: fatigue.reason ?? null,
            ...(input.meta ?? {}),
          } as Prisma.InputJsonValue,
          sentAt: status === "SENT" ? now : null,
        },
      });
      firstId = firstId || alert.id;
      lastStatus = {
        ok: true,
        alertId: alert.id,
        status: suppressed
          ? "SUPPRESSED"
          : status === "PENDING"
            ? "PENDING"
            : "SENT",
      };

      emitAlertTelemetry({
        type: "alert_delivered",
        channel,
        alertType: type,
        status: lastStatus.status,
      });

      // Mirror IN_APP to Notification for legacy inbox readers
      if (channel === "IN_APP" && !suppressed) {
        await prisma.notification.create({
          data: {
            userId: input.userId,
            channel: "IN_APP",
            title: input.title,
            body: input.body,
            meta: {
              category: "transactional",
              propertyAlertId: alert.id,
              propertyId: input.propertyId,
              alertType: type,
              href,
            } as Prisma.InputJsonValue,
          },
        });
      }

      if (!suppressed) {
        await prisma.propertyAlertEvent.update({
          where: { id: event.id },
          data: { deliveredAt: now },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Unique") || msg.includes("unique")) {
        lastStatus = { ok: true, alertId: firstId, status: "DEDUPED" };
        emitAlertTelemetry({
          type: "alert_duplicate_suppressed",
          alertType: type,
          reason: "dedupe_key",
        });
        continue;
      }
      emitAlertTelemetry({
        type: "alert_failed",
        channel,
        alertType: type,
        code: "deliver_exception",
        retryable: true,
      });
      return { ok: false, error: "Doručení upozornění selhalo." };
    }
  }

  return {
    ok: true,
    alertId: firstId || (lastStatus.ok ? lastStatus.alertId : ""),
    status: lastStatus.ok ? lastStatus.status : "SENT",
  };
}
