/**
 * Comparison sharing service (BOD 78–81, 131).
 * Modes: INVITED_USERS | SECRET_LINK (high-entropy token + expiry).
 * Never auto-publishes a public URL without explicit secret link creation.
 */

import { createHash, randomBytes } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { track } from "@/lib/analytics/events";
import {
  classifySecretShareAccess,
  secretShareAccessErrorCs,
} from "./share-access";
import {
  assertShareSafePayload,
  DEFAULT_SHARE_INCLUDE,
  type ShareIncludeFlags,
  type ShareSafeComparisonView,
  type ShareSafePropertyView,
} from "./share-safe";

const DEFAULT_TTL_DAYS = 14;
const TOKEN_BYTES = 32;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function generateRawToken(): { raw: string; hash: string; prefix: string } {
  const raw = randomBytes(TOKEN_BYTES).toString("base64url");
  return { raw, hash: hashToken(raw), prefix: raw.slice(0, 8) };
}

export function buildShareSafeView(input: {
  comparisonId: string;
  name: string | null;
  includeFlags: ShareIncludeFlags;
  properties: Array<{
    propertyId: string;
    slug: string;
    title: string;
    href: string;
    askingPriceCzk?: number | null;
    usableArea?: number | null;
    layout?: string | null;
    propertyType?: string | null;
    city?: string | null;
    valuationMidCzk?: number | null;
    valuationConfidence?: string | null;
    grossYieldPct?: number | null;
    netYieldPct?: number | null;
    cashFlowMonthlyCzk?: number | null;
    renovationBaseCzk?: number | null;
    arvCzk?: number | null;
    risks?: Array<{ title: string; severity: string }>;
    majetioScore?: number | null;
    locationLabel?: string | null;
  }>;
}): ShareSafeComparisonView {
  const flags = { ...DEFAULT_SHARE_INCLUDE, ...input.includeFlags };
  // Force-disable personal surfaces even if caller tries
  const safeFlags: ShareIncludeFlags = {
    ...flags,
  };

  const properties: ShareSafePropertyView[] = input.properties.map((p) => {
    const row: ShareSafePropertyView = {
      propertyId: p.propertyId,
      slug: p.slug,
      title: p.title,
      href: p.href,
    };
    if (safeFlags.basics) {
      row.basics = {
        askingPriceCzk: p.askingPriceCzk ?? null,
        usableArea: p.usableArea ?? null,
        layout: p.layout ?? null,
        propertyType: p.propertyType ?? null,
        city: p.city ?? null,
      };
    }
    if (safeFlags.valuation) {
      row.valuation = {
        midCzk: p.valuationMidCzk ?? null,
        confidence: p.valuationConfidence ?? null,
      };
    }
    if (safeFlags.investment) {
      row.investment = {
        grossYieldPct: p.grossYieldPct ?? null,
        netYieldPct: p.netYieldPct ?? null,
        cashFlowMonthlyCzk: p.cashFlowMonthlyCzk ?? null,
      };
    }
    if (safeFlags.renovation) {
      row.renovation = {
        costBaseCzk: p.renovationBaseCzk ?? null,
        arvCzk: p.arvCzk ?? null,
      };
    }
    if (safeFlags.risks) {
      row.risks = (p.risks ?? []).map((r) => ({
        title: r.title,
        severity: r.severity,
      }));
    }
    if (safeFlags.scores) {
      row.scores = {
        majetioScore: p.majetioScore ?? null,
        locationLabel: p.locationLabel ?? null,
      };
    }
    return row;
  });

  const view: ShareSafeComparisonView = {
    schemaVersion: "1.0.0",
    comparisonId: input.comparisonId,
    name: input.name,
    sharedAt: new Date().toISOString(),
    includeFlags: safeFlags,
    properties,
    disclaimerCs:
      "Sdílený pohled je read-only a neobsahuje Finanční pas, příjmy, osobní financování ani soukromé poznámky.",
  };

  assertShareSafePayload(view);
  return view;
}

async function assertOwnsComparison(comparisonId: string, userId: string) {
  const row = await prisma.comparison.findFirst({
    where: { id: comparisonId, userId },
    include: {
      properties: {
        orderBy: { sortOrder: "asc" },
        include: {
          property: {
            select: {
              id: true,
              slug: true,
              title: true,
              askingPrice: true,
              usableArea: true,
              layout: true,
              propertyType: true,
              publicCity: true,
              publicLabel: true,
            },
          },
        },
      },
    },
  });
  return row;
}

export async function createComparisonShare(input: {
  userId: string;
  comparisonId: string;
  mode: "INVITED_USERS" | "SECRET_LINK";
  includeFlags?: Partial<ShareIncludeFlags>;
  inviteUserIds?: string[];
  expiresInDays?: number;
}): Promise<
  | {
      ok: true;
      shareId: string;
      mode: "INVITED_USERS" | "SECRET_LINK";
      /** Raw token only for SECRET_LINK — shown once. */
      rawToken: string | null;
      expiresAt: string | null;
      path: string | null;
    }
  | { ok: false; error: string }
> {
  const comparison = await assertOwnsComparison(
    input.comparisonId,
    input.userId,
  );
  if (!comparison) return { ok: false, error: "Porovnání nenalezeno." };

  const includeFlags: ShareIncludeFlags = {
    ...DEFAULT_SHARE_INCLUDE,
    ...input.includeFlags,
  };

  const safePayload = buildShareSafeView({
    comparisonId: comparison.id,
    name: comparison.name,
    includeFlags,
    properties: comparison.properties.map((cp) => ({
      propertyId: cp.property.id,
      slug: cp.property.slug,
      title: cp.property.title,
      href: `/nemovitosti/${cp.property.slug}`,
      askingPriceCzk: cp.property.askingPrice,
      usableArea: cp.property.usableArea,
      layout: cp.property.layout,
      propertyType: cp.property.propertyType,
      city: cp.property.publicCity,
      locationLabel: cp.property.publicLabel,
    })),
  });

  const expiresAt =
    input.expiresInDays != null
      ? new Date(Date.now() + input.expiresInDays * 86_400_000)
      : input.mode === "SECRET_LINK"
        ? new Date(Date.now() + DEFAULT_TTL_DAYS * 86_400_000)
        : null;

  let token: ReturnType<typeof generateRawToken> | null = null;
  if (input.mode === "SECRET_LINK") {
    token = generateRawToken();
  }

  if (input.mode === "INVITED_USERS") {
    const invites = [...new Set(input.inviteUserIds ?? [])].filter(
      (id) => id !== input.userId,
    );
    if (invites.length === 0) {
      return {
        ok: false,
        error: "Pro režim pozvánek vyberte alespoň jednoho uživatele.",
      };
    }
  }

  const share = await prisma.comparisonShare.create({
    data: {
      comparisonId: comparison.id,
      createdById: input.userId,
      mode: input.mode,
      tokenHash: token?.hash ?? null,
      tokenPrefix: token?.prefix ?? null,
      expiresAt,
      includeFlags: includeFlags as unknown as Prisma.InputJsonValue,
      safePayload: safePayload as unknown as Prisma.InputJsonValue,
      invites:
        input.mode === "INVITED_USERS"
          ? {
              create: [...new Set(input.inviteUserIds ?? [])]
                .filter((id) => id !== input.userId)
                .map((userId) => ({ userId })),
            }
          : undefined,
    },
    select: { id: true },
  });

  track({
    name: "comparison_shared",
    props: {
      mode: input.mode === "SECRET_LINK" ? "secret_link" : "invited_users",
      property_count: comparison.properties.length,
    },
  });

  return {
    ok: true,
    shareId: share.id,
    mode: input.mode,
    rawToken: token?.raw ?? null,
    expiresAt: expiresAt?.toISOString() ?? null,
    path:
      token != null ? `/sdilene/porovnani/${token.raw}` : null,
  };
}

export async function revokeComparisonShare(input: {
  userId: string;
  shareId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const share = await prisma.comparisonShare.findFirst({
    where: { id: input.shareId, createdById: input.userId },
    select: { id: true },
  });
  if (!share) return { ok: false, error: "Sdílení nenalezeno." };
  await prisma.comparisonShare.update({
    where: { id: share.id },
    data: { revokedAt: new Date() },
  });
  return { ok: true };
}

export async function resolveSecretShare(
  rawToken: string,
): Promise<
  | { ok: true; view: ShareSafeComparisonView; shareId: string }
  | { ok: false; error: string }
> {
  const tokenOk = Boolean(rawToken && rawToken.length >= 16);
  if (!tokenOk) {
    return { ok: false, error: secretShareAccessErrorCs("invalid") };
  }

  const hash = hashToken(rawToken);
  const share = await prisma.comparisonShare.findFirst({
    where: {
      tokenHash: hash,
      mode: "SECRET_LINK",
    },
  });

  const status = classifySecretShareAccess({
    tokenOk: true,
    found: Boolean(share),
    revokedAt: share?.revokedAt ?? null,
    expiresAt: share?.expiresAt ?? null,
  });
  if (status !== "ok" || !share) {
    return {
      ok: false,
      error:
        status === "invalid" && !share
          ? "Odkaz neexistuje nebo byl zneplatněn."
          : secretShareAccessErrorCs(status),
    };
  }

  assertShareSafePayload(share.safePayload);

  await prisma.comparisonShare.update({
    where: { id: share.id },
    data: { lastAccessedAt: new Date() },
  });

  track({
    name: "comparison_share_opened",
    props: { mode: "secret_link" },
  });

  return {
    ok: true,
    shareId: share.id,
    view: share.safePayload as unknown as ShareSafeComparisonView,
  };
}

/**
 * Owner-scoped list of shares for a comparison (revoke / manage).
 */
export async function listComparisonShares(input: {
  userId: string;
  comparisonId: string;
}): Promise<
  Array<{
    id: string;
    mode: "INVITED_USERS" | "SECRET_LINK";
    expiresAt: string | null;
    revokedAt: string | null;
    createdAt: string;
    tokenPrefix: string | null;
    inviteCount: number;
  }>
> {
  const owned = await assertOwnsComparison(input.comparisonId, input.userId);
  if (!owned) return [];

  const rows = await prisma.comparisonShare.findMany({
    where: { comparisonId: input.comparisonId, createdById: input.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      mode: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
      tokenPrefix: true,
      _count: { select: { invites: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    mode: r.mode,
    expiresAt: r.expiresAt?.toISOString() ?? null,
    revokedAt: r.revokedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    tokenPrefix: r.tokenPrefix,
    inviteCount: r._count.invites,
  }));
}

export async function resolveInvitedShare(input: {
  shareId: string;
  userId: string;
}): Promise<
  | { ok: true; view: ShareSafeComparisonView }
  | { ok: false; error: string }
> {
  const share = await prisma.comparisonShare.findFirst({
    where: {
      id: input.shareId,
      mode: "INVITED_USERS",
      OR: [
        { createdById: input.userId },
        { invites: { some: { userId: input.userId } } },
      ],
    },
  });
  if (!share) return { ok: false, error: "Sdílení není dostupné." };

  const status = classifySecretShareAccess({
    tokenOk: true,
    found: true,
    revokedAt: share.revokedAt,
    expiresAt: share.expiresAt,
  });
  if (status !== "ok") {
    return { ok: false, error: secretShareAccessErrorCs(status) };
  }

  assertShareSafePayload(share.safePayload);
  return {
    ok: true,
    view: share.safePayload as unknown as ShareSafeComparisonView,
  };
}
