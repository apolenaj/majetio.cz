/**
 * Decision timeline — derived from AuditLog + domain facts.
 * Never records page views.
 */

import { prisma } from "@/lib/db";

export type DecisionTimelineEvent = {
  id: string;
  at: string;
  kind: string;
  label: string;
  propertyId: string | null;
  href: string | null;
};

const FAVOURITE_AUDIT_ACTIONS = [
  "favourite.save",
  "favourite.remove",
  "favourite.shortlist",
  "favourite.status_change",
] as const;

const TIMELINE_LABELS: Record<string, string> = {
  "favourite.save": "Uložena",
  "favourite.remove": "Odebrána z uložených",
  "favourite.shortlist": "Přidána do shortlistu",
  "favourite.status_change": "Změna stavu ve výběru",
  "comparison.add": "Přidána do porovnání",
  PRICE_DECREASE: "Cena změněna (pokles)",
  PRICE_INCREASE: "Cena změněna (růst)",
  PRICE_DROP: "Cena změněna (pokles)",
  STATUS_CHANGED: "Změna stavu nabídky",
  RELISTED: "Znovu v nabídce",
  NEW_ANALYSIS_AVAILABLE: "Analyzována",
  FINANCING_CHANGED: "Změna financování",
};

function metaPropertyId(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const id = (meta as { propertyId?: unknown }).propertyId;
  return typeof id === "string" ? id : null;
}

function metaStatusLabel(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const status = (meta as { status?: unknown }).status;
  if (typeof status !== "string") return null;
  const map: Record<string, string> = {
    CONSIDERING: "Zvažuji",
    VIEWING: "Prohlídka",
    FAVORITE: "Favorit",
    REJECTED: "Vyřazeno",
    // Legacy audit meta
    SAVED: "Zvažuji",
    SHORTLISTED: "Favorit",
    VIEWING_PLANNED: "Prohlídka",
    ANALYZING: "Zvažuji",
  };
  return map[status] ?? null;
}

/**
 * Build a chronological decision timeline for one property (favourite context).
 */
export async function buildPropertyDecisionTimeline(input: {
  userId: string;
  propertyId: string;
  propertySlug?: string | null;
  limit?: number;
}): Promise<DecisionTimelineEvent[]> {
  const limit = Math.min(40, Math.max(5, input.limit ?? 20));
  const href = input.propertySlug
    ? `/nemovitosti/${input.propertySlug}`
    : null;

  const [audits, alerts, analyses, favourite] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        actorId: input.userId,
        action: { in: [...FAVOURITE_AUDIT_ACTIONS] },
      },
      orderBy: { createdAt: "asc" },
      take: 80,
    }),
    prisma.propertyAlert.findMany({
      where: {
        userId: input.userId,
        propertyId: input.propertyId,
        channel: "IN_APP",
        status: { not: "SUPPRESSED" },
        NOT: { title: "match-marker" },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    }),
    prisma.propertyAnalysis.findMany({
      where: { userId: input.userId, propertyId: input.propertyId },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: { id: true, createdAt: true, status: true },
    }),
    prisma.favourite.findUnique({
      where: {
        userId_propertyId: {
          userId: input.userId,
          propertyId: input.propertyId,
        },
      },
      select: { createdAt: true, status: true },
    }),
  ]);

  const propertyAudits = audits.filter(
    (a) =>
      metaPropertyId(a.meta) === input.propertyId ||
      a.entityId === input.propertyId,
  );

  const events: DecisionTimelineEvent[] = [];

  if (favourite) {
    events.push({
      id: `fav-created-${input.propertyId}`,
      at: favourite.createdAt.toISOString(),
      kind: "favourite.save",
      label: "Uložena",
      propertyId: input.propertyId,
      href,
    });
  }

  for (const a of propertyAudits) {
    const statusLabel = metaStatusLabel(a.meta);
    events.push({
      id: a.id,
      at: a.createdAt.toISOString(),
      kind: a.action,
      label:
        statusLabel ??
        TIMELINE_LABELS[a.action] ??
        a.action,
      propertyId: metaPropertyId(a.meta) ?? input.propertyId,
      href,
    });
  }

  for (const alert of alerts) {
    events.push({
      id: `alert-${alert.id}`,
      at: alert.createdAt.toISOString(),
      kind: alert.type,
      label: TIMELINE_LABELS[alert.type] ?? alert.title,
      propertyId: input.propertyId,
      href: alert.href ?? href,
    });
  }

  for (const analysis of analyses) {
    events.push({
      id: `analysis-${analysis.id}`,
      at: analysis.createdAt.toISOString(),
      kind: "analysis",
      label: "Analyzována",
      propertyId: input.propertyId,
      href: `/analyza/${analysis.id}`,
    });
  }

  // Dedupe near-identical labels at same second
  const sorted = events.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
  const deduped: DecisionTimelineEvent[] = [];
  for (const ev of sorted) {
    const prev = deduped[deduped.length - 1];
    if (
      prev &&
      prev.label === ev.label &&
      Math.abs(new Date(prev.at).getTime() - new Date(ev.at).getTime()) < 2000
    ) {
      continue;
    }
    deduped.push(ev);
  }
  return deduped.slice(-limit);
}

/** Recent decision-related changes across the user's workspace. */
export async function listRecentDecisionChanges(input: {
  userId: string;
  limit?: number;
}): Promise<DecisionTimelineEvent[]> {
  const limit = Math.min(30, Math.max(5, input.limit ?? 12));

  const [audits, alerts] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        actorId: input.userId,
        action: {
          in: [
            ...FAVOURITE_AUDIT_ACTIONS,
            "saved_search.create",
            "comparison.create",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.propertyAlert.findMany({
      where: {
        userId: input.userId,
        channel: "IN_APP",
        status: { not: "SUPPRESSED" },
        NOT: { title: "match-marker" },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        property: { select: { id: true, title: true, slug: true } },
      },
    }),
  ]);

  const events: DecisionTimelineEvent[] = [];

  for (const a of audits) {
    const propertyId = metaPropertyId(a.meta) ?? a.entityId;
    events.push({
      id: a.id,
      at: a.createdAt.toISOString(),
      kind: a.action,
      label: TIMELINE_LABELS[a.action] ?? a.action,
      propertyId,
      href: null,
    });
  }

  for (const alert of alerts) {
    events.push({
      id: `alert-${alert.id}`,
      at: alert.createdAt.toISOString(),
      kind: alert.type,
      label: alert.title,
      propertyId: alert.propertyId,
      href:
        alert.href ??
        (alert.property ? `/nemovitosti/${alert.property.slug}` : null),
    });
  }

  return events
    .sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    )
    .slice(0, limit);
}
