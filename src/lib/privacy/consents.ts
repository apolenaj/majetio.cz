"use server";

import { ConsentType } from "@prisma/client";
import { z } from "zod";

import { writeAuditLog } from "@/lib/auth/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { track } from "@/lib/analytics/events";
import {
  CONSENT_LABELS,
  consentVersionFor,
} from "@/lib/privacy/constants";

export type ConsentSnapshot = {
  type: ConsentType;
  title: string;
  description: string;
  required: boolean;
  version: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  source: string | null;
};

export type DataHandoffHistoryItem = {
  id: string;
  recipient: string;
  purpose: string;
  fields: string[];
  version: string;
  consentTextVersion: string | null;
  consentAt: string | null;
  source: string;
  createdAt: string;
  status: string;
  externalLeadId: string | null;
  consentType: string;
};

export type ConsentsPageData = {
  consents: ConsentSnapshot[];
  history: DataHandoffHistoryItem[];
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

function latestByType(
  rows: {
    type: ConsentType;
    granted: boolean;
    version: string;
    grantedAt: Date | null;
    revokedAt: Date | null;
    metadata: unknown;
    createdAt: Date;
  }[],
): Map<ConsentType, (typeof rows)[number]> {
  const map = new Map<ConsentType, (typeof rows)[number]>();
  for (const row of rows) {
    const prev = map.get(row.type);
    if (!prev || row.createdAt > prev.createdAt) {
      map.set(row.type, row);
    }
  }
  return map;
}

export async function loadConsentsPage(): Promise<
  { ok: true; data: ConsentsPageData } | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const [consentRows, leads] = await Promise.all([
    prisma.consent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lead.findMany({
      where: { userId, type: "FINANCING" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { activities: { orderBy: { createdAt: "desc" }, take: 3 } },
    }),
  ]);

  const latest = latestByType(consentRows);
  const types = Object.keys(CONSENT_LABELS) as ConsentType[];

  const consents: ConsentSnapshot[] = types.map((type) => {
    const meta = CONSENT_LABELS[type];
    const row = latest.get(type);
    const source =
      row?.metadata &&
      typeof row.metadata === "object" &&
      row.metadata !== null &&
      "source" in row.metadata
        ? String((row.metadata as { source?: string }).source ?? "")
        : null;

    return {
      type,
      title: meta.title,
      description: meta.description,
      required: Boolean(meta.required),
      version: row?.version ?? consentVersionFor(type),
      granted: Boolean(row?.granted && !row.revokedAt),
      grantedAt: row?.grantedAt?.toISOString() ?? null,
      revokedAt: row?.revokedAt?.toISOString() ?? null,
      source,
    };
  });

  const history: DataHandoffHistoryItem[] = [];
  for (const lead of leads) {
    const payload =
      lead.payload && typeof lead.payload === "object"
        ? (lead.payload as Record<string, unknown>)
        : {};
    history.push({
      id: lead.id,
      recipient: String(payload.recipient ?? "HypotekaJasne.cz"),
      purpose: String(payload.purpose ?? "Posouzení možností financování"),
      fields: Array.isArray(payload.sharedFieldLabels)
        ? (payload.sharedFieldLabels as string[])
        : [],
      version: String(payload.consentVersion ?? "—"),
      consentTextVersion:
        typeof payload.consentTextVersion === "string"
          ? payload.consentTextVersion
          : null,
      consentAt:
        typeof payload.consentAt === "string" ? payload.consentAt : null,
      source: String(payload.source ?? "ucet"),
      createdAt: lead.createdAt.toISOString(),
      status: lead.status,
      externalLeadId:
        typeof payload.externalLeadId === "string" ? payload.externalLeadId : null,
      consentType: String(
        payload.consentType ?? "MORTGAGE_LEAD_DATA_TRANSFER",
      ),
    });
  }

  // Consent receipts without lead (or as supplement for MORTGAGE_LEAD_DATA_TRANSFER)
  const handoffConsentTypes = [
    ConsentType.MORTGAGE_LEAD_DATA_TRANSFER,
    ConsentType.HYPOTEKAJASNE_HANDOFF,
  ] as const;

  for (const row of consentRows) {
    if (!handoffConsentTypes.includes(row.type as (typeof handoffConsentTypes)[number])) continue;
    if (!row.granted) continue;
    const meta =
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {};
    if (meta.leadId && history.some((h) => h.id === String(meta.leadId))) continue;
    if (history.some((h) => h.id === row.id)) continue;
    history.push({
      id: row.id,
      recipient: String(meta.recipient ?? "HypotekaJasne.cz"),
      purpose: String(meta.purpose ?? "Posouzení možností financování"),
      fields: Array.isArray(meta.sharedFieldLabels)
        ? (meta.sharedFieldLabels as string[])
        : [],
      version: row.version,
      consentTextVersion:
        typeof meta.consentTextVersion === "string"
          ? meta.consentTextVersion
          : null,
      consentAt: (row.grantedAt ?? row.createdAt).toISOString(),
      source: String(meta.source ?? "unknown"),
      createdAt: (row.grantedAt ?? row.createdAt).toISOString(),
      status: "CONSENT_RECORDED",
      externalLeadId:
        typeof meta.externalLeadId === "string" ? meta.externalLeadId : null,
      consentType: row.type,
    });
  }

  history.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return { ok: true, data: { consents, history } };
}

const marketingSchema = z.object({
  granted: z.boolean(),
  source: z.string().max(64).default("ucet/souhlasy"),
  /** When false, only Consent rows change — notification channel prefs stay as-is. */
  syncChannelPrefs: z.boolean().default(true),
});

export async function setMarketingConsent(
  raw: z.input<typeof marketingSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const parsed = marketingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Neplatný požadavek." };

  const version = consentVersionFor(ConsentType.MARKETING);
  const now = new Date();

  await prisma.consent.updateMany({
    where: {
      userId,
      type: ConsentType.MARKETING,
      granted: true,
      revokedAt: null,
    },
    data: { revokedAt: now, granted: false },
  });

  if (parsed.data.granted) {
    await prisma.consent.create({
      data: {
        userId,
        type: ConsentType.MARKETING,
        granted: true,
        version,
        grantedAt: now,
        metadata: { source: parsed.data.source },
      },
    });
    if (parsed.data.syncChannelPrefs) {
      await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          preferredLocale: "cs",
          notifyMarketingEmail: true,
          notifyMarketingInApp: true,
        },
        update: {
          notifyMarketingEmail: true,
          notifyMarketingInApp: true,
        },
      });
    }
    await writeAuditLog({
      action: "consent.grant",
      entity: "Consent",
      entityId: userId,
      actorId: userId,
      meta: { type: "MARKETING", version, source: parsed.data.source },
    });
    track({
      name: "consent_given",
      props: { type: "MARKETING", source: parsed.data.source },
    });
  } else {
    if (parsed.data.syncChannelPrefs) {
      await prisma.userProfile.updateMany({
        where: { userId },
        data: {
          notifyMarketingEmail: false,
          notifyMarketingInApp: false,
        },
      });
    }
    await writeAuditLog({
      action: "consent.revoke",
      entity: "Consent",
      entityId: userId,
      actorId: userId,
      meta: { type: "MARKETING", version, source: parsed.data.source },
    });
    track({
      name: "consent_revoked",
      props: { type: "MARKETING", source: parsed.data.source },
    });
  }

  return { ok: true };
}
