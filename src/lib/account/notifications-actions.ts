"use server";

import { z } from "zod";

import { writeAuditLog } from "@/lib/auth/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setMarketingConsent } from "@/lib/privacy/consents";

export type NotificationPrefs = {
  transactionalEmail: boolean;
  transactionalInApp: boolean;
  marketingEmail: boolean;
  marketingInApp: boolean;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  channel: string;
  category: "transactional" | "marketing" | "unknown";
  readAt: string | null;
  createdAt: string;
};

export type NotificationsPageData = {
  prefs: NotificationPrefs;
  items: NotificationItem[];
};

async function requireUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

function categoryFromMeta(meta: unknown): NotificationItem["category"] {
  if (meta && typeof meta === "object" && "category" in meta) {
    const cat = (meta as { category?: string }).category;
    if (cat === "marketing" || cat === "transactional") return cat;
  }
  return "unknown";
}

export async function loadNotificationsPage(): Promise<
  { ok: true; data: NotificationsPageData } | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const [profile, items] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return {
    ok: true,
    data: {
      prefs: {
        transactionalEmail: profile?.notifyTransactionalEmail ?? true,
        transactionalInApp: profile?.notifyTransactionalInApp ?? true,
        marketingEmail: profile?.notifyMarketingEmail ?? false,
        marketingInApp: profile?.notifyMarketingInApp ?? false,
      },
      items: items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        channel: n.channel,
        category: categoryFromMeta(n.meta),
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
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

  // Keep MARKETING consent in sync with marketing toggles (never auto-grant without intent).
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
    meta: data,
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
