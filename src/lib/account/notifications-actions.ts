"use server";

import { z } from "zod";

import { writeAuditLog } from "@/lib/auth/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { track } from "@/lib/analytics/events";
import { setMarketingConsent } from "@/lib/privacy/consents";
import { propertyAlertTypeLabel } from "@/domains/notifications/service/alert-copy";

export type NotificationPrefs = {
  transactionalEmail: boolean;
  transactionalInApp: boolean;
  marketingEmail: boolean;
  marketingInApp: boolean;
};

export type PropertyAlertInboxItem = {
  id: string;
  kind: "property_alert";
  title: string;
  body: string | null;
  type: string;
  typeLabel: string;
  channel: string;
  status: string;
  unread: boolean;
  propertyId: string | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  href: string | null;
  ctaLabel: string;
  createdAt: string;
  readAt: string | null;
};

export type LegacyNotificationItem = {
  id: string;
  kind: "legacy_notification";
  title: string;
  body: string | null;
  channel: string;
  category: "transactional" | "marketing" | "unknown";
  unread: boolean;
  href: string | null;
  ctaLabel: string;
  createdAt: string;
  readAt: string | null;
};

export type InboxItem = PropertyAlertInboxItem | LegacyNotificationItem;

export type NotificationsPageData = {
  prefs: NotificationPrefs;
  items: InboxItem[];
  unreadCount: number;
};

async function requireUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

function categoryFromMeta(meta: unknown): LegacyNotificationItem["category"] {
  if (meta && typeof meta === "object" && "category" in meta) {
    const cat = (meta as { category?: string }).category;
    if (cat === "marketing" || cat === "transactional") return cat;
  }
  return "unknown";
}

function hrefFromMeta(meta: unknown): string | null {
  if (meta && typeof meta === "object" && "href" in meta) {
    const href = (meta as { href?: unknown }).href;
    return typeof href === "string" ? href : null;
  }
  return null;
}

function ctaForAlert(type: string, href: string | null): string {
  if (!href) return "Zobrazit";
  if (type === "SAVED_SEARCH_MATCH") return "Otevřít hledání";
  if (type === "NEW_ANALYSIS_AVAILABLE") return "Otevřít analýzu";
  if (type === "FINANCING_CHANGED") return "Zobrazit financování";
  return "Zobrazit nemovitost";
}

export async function loadNotificationsPage(): Promise<
  { ok: true; data: NotificationsPageData } | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const [profile, alerts, legacy] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.propertyAlert.findMany({
      where: {
        userId,
        channel: "IN_APP",
        status: { not: "SUPPRESSED" },
        NOT: { title: "match-marker" },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        property: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const alertIdsMirrored = new Set<string>();
  for (const n of legacy) {
    const meta = n.meta;
    if (meta && typeof meta === "object" && "propertyAlertId" in meta) {
      const id = (meta as { propertyAlertId?: unknown }).propertyAlertId;
      if (typeof id === "string") alertIdsMirrored.add(id);
    }
  }

  const alertItems: PropertyAlertInboxItem[] = alerts.map((a) => {
    const unread = a.readAt == null && a.status !== "READ";
    return {
      id: a.id,
      kind: "property_alert",
      title: a.title,
      body: a.body,
      type: a.type,
      typeLabel: propertyAlertTypeLabel(a.type),
      channel: a.channel,
      status: a.status,
      unread,
      propertyId: a.propertyId,
      propertyTitle: a.property?.title ?? null,
      propertySlug: a.property?.slug ?? null,
      href: a.href,
      ctaLabel: ctaForAlert(a.type, a.href),
      createdAt: a.createdAt.toISOString(),
      readAt: a.readAt?.toISOString() ?? null,
    };
  });

  // Legacy notifications not already mirrored from PropertyAlert
  const legacyItems: LegacyNotificationItem[] = legacy
    .filter((n) => {
      const meta = n.meta;
      if (meta && typeof meta === "object" && "propertyAlertId" in meta) {
        return false;
      }
      return true;
    })
    .map((n) => {
      const href = hrefFromMeta(n.meta);
      return {
        id: n.id,
        kind: "legacy_notification" as const,
        title: n.title,
        body: n.body,
        channel: n.channel,
        category: categoryFromMeta(n.meta),
        unread: n.readAt == null,
        href,
        ctaLabel: href ? "Otevřít" : "Zobrazit",
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString() ?? null,
      };
    });

  const items: InboxItem[] = [...alertItems, ...legacyItems].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  void alertIdsMirrored;

  return {
    ok: true,
    data: {
      prefs: {
        transactionalEmail: profile?.notifyTransactionalEmail ?? true,
        transactionalInApp: profile?.notifyTransactionalInApp ?? true,
        marketingEmail: profile?.notifyMarketingEmail ?? false,
        marketingInApp: profile?.notifyMarketingInApp ?? false,
      },
      items,
      unreadCount: items.filter((i) => i.unread).length,
    },
  };
}

const prefsSchema = z.object({
  transactionalEmail: z.boolean(),
  transactionalInApp: z.boolean(),
  marketingEmail: z.boolean(),
  marketingInApp: z.boolean(),
});

export async function saveNotificationPrefs(
  raw: z.input<typeof prefsSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const parsed = prefsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Neplatná data." };

  const data = parsed.data;
  await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      preferredLocale: "cs",
      notifyTransactionalEmail: data.transactionalEmail,
      notifyTransactionalInApp: data.transactionalInApp,
      notifyMarketingEmail: data.marketingEmail,
      notifyMarketingInApp: data.marketingInApp,
    },
    update: {
      notifyTransactionalEmail: data.transactionalEmail,
      notifyTransactionalInApp: data.transactionalInApp,
      notifyMarketingEmail: data.marketingEmail,
      notifyMarketingInApp: data.marketingInApp,
    },
  });

  const wantsMarketing = data.marketingEmail || data.marketingInApp;
  await setMarketingConsent({
    granted: wantsMarketing,
    source: "ucet/upozorneni",
    syncChannelPrefs: false,
  });

  await writeAuditLog({
    action: "account.notification_prefs.update",
    entity: "UserProfile",
    entityId: userId,
    actorId: userId,
    meta: {
      marketing_enabled: wantsMarketing,
      transactional_email: data.transactionalEmail,
    },
  });

  track({
    name: "notification_prefs_updated",
    props: {
      marketing_enabled: wantsMarketing,
      transactional_email: data.transactionalEmail,
    },
  });

  return { ok: true };
}

export async function markNotificationRead(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

export async function markPropertyAlertRead(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const now = new Date();
  const existing = await prisma.propertyAlert.findFirst({
    where: { id, userId },
    select: { type: true, channel: true },
  });

  await prisma.propertyAlert.updateMany({
    where: {
      id,
      userId,
      OR: [{ readAt: null }, { status: { not: "READ" } }],
    },
    data: { readAt: now, status: "READ" },
  });

  // Mirror legacy Notification rows linked to this alert
  const linked = await prisma.notification.findMany({
    where: { userId },
    select: { id: true, meta: true, readAt: true },
    take: 100,
  });
  const ids = linked
    .filter((n) => {
      if (n.readAt) return false;
      const meta = n.meta;
      return (
        meta &&
        typeof meta === "object" &&
        (meta as { propertyAlertId?: string }).propertyAlertId === id
      );
    })
    .map((n) => n.id);
  if (ids.length) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId },
      data: { readAt: now },
    });
  }

  if (existing) {
    track({
      name: "price_alert_opened",
      props: {
        alert_type: existing.type,
        channel: existing.channel,
      },
    });
    const { recordDecisionMetric } = await import(
      "@/lib/analytics/decision-metrics"
    );
    recordDecisionMetric("price_alert_opened");
  }

  return { ok: true };
}

export async function markAllInboxRead(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const now = new Date();
  await Promise.all([
    prisma.propertyAlert.updateMany({
      where: {
        userId,
        channel: "IN_APP",
        status: { not: "SUPPRESSED" },
        readAt: null,
      },
      data: { readAt: now, status: "READ" },
    }),
    prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: now },
    }),
  ]);
  return { ok: true };
}
