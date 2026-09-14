/**
 * Renovation cost catalog governance — versioned + price-jump anomalies.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import {
  DEMO_COST_CATALOG_V2026_07,
  DEMO_COST_CATALOG_VERSION,
  type RenovationCostCatalog,
  type RenovationCostCatalogEntry,
} from "@/domains/renovation/costs/catalog";

/** Flag when baseCost jumps by this relative amount vs previous version. */
export const CATALOG_PRICE_JUMP_RATIO = 3; // 300%

export type CatalogPriceAnomaly = {
  entryId: string;
  item: string;
  previousBase: number;
  nextBase: number;
  jumpRatio: number;
  message: string;
};

export function detectCatalogPriceAnomalies(
  previous: RenovationCostCatalogEntry[],
  next: RenovationCostCatalogEntry[],
  jumpRatio = CATALOG_PRICE_JUMP_RATIO,
): CatalogPriceAnomaly[] {
  const prevByKey = new Map(
    previous.map((e) => [`${e.category}:${e.item}:${e.qualityLevel}:${e.unit}`, e]),
  );
  const anomalies: CatalogPriceAnomaly[] = [];
  for (const e of next) {
    const key = `${e.category}:${e.item}:${e.qualityLevel}:${e.unit}`;
    const prev = prevByKey.get(key);
    if (!prev || !(prev.baseCost > 0)) continue;
    const ratio = e.baseCost / prev.baseCost;
    if (ratio >= jumpRatio || ratio <= 1 / jumpRatio) {
      anomalies.push({
        entryId: e.id,
        item: e.item,
        previousBase: prev.baseCost,
        nextBase: e.baseCost,
        jumpRatio: ratio,
        message: `Cena položky ${e.item} skočila ${((ratio - 1) * 100).toFixed(0)} % (${prev.baseCost} → ${e.baseCost}).`,
      });
    }
  }
  return anomalies;
}

export async function listRenovationCatalogVersions(): Promise<{
  items: Array<{
    id: string;
    versionKey: string;
    label: string;
    approvalStatus: string;
    isCurrent: boolean;
    anomalyCount: number;
    changeReason: string | null;
  }>;
  codeVersions: string[];
  error: string | null;
}> {
  try {
    const rows = await prisma.renovationCostCatalogVersion.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    return {
      items: rows.map((r) => {
        const flags = Array.isArray(r.anomalyFlags)
          ? r.anomalyFlags
          : [];
        return {
          id: r.id,
          versionKey: r.versionKey,
          label: r.label,
          approvalStatus: r.approvalStatus,
          isCurrent: r.isCurrent,
          anomalyCount: flags.length,
          changeReason: r.changeReason,
        };
      }),
      codeVersions: [DEMO_COST_CATALOG_VERSION],
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      codeVersions: [DEMO_COST_CATALOG_VERSION],
      error: err instanceof Error ? err.message : "Catalog list failed",
    };
  }
}

export async function createRenovationCatalogDraft(input: {
  versionKey: string;
  label: string;
  changeReason: string;
  catalog?: RenovationCostCatalog;
  actorUserId: string;
}): Promise<
  | { ok: true; id: string; anomalyCount: number }
  | { ok: false; error: string }
> {
  if (input.changeReason.trim().length < 8) {
    return { ok: false, error: "changeReason required." };
  }

  const previous =
    (await prisma.renovationCostCatalogVersion.findFirst({
      where: { isCurrent: true },
    })) ?? null;

  const prevCatalog = previous
    ? (previous.catalogJson as unknown as RenovationCostCatalog)
    : DEMO_COST_CATALOG_V2026_07;

  const nextCatalog: RenovationCostCatalog =
    input.catalog ??
    ({
      ...prevCatalog,
      version: input.versionKey,
      effectiveFrom: new Date().toISOString(),
    } as RenovationCostCatalog);

  const anomalies = detectCatalogPriceAnomalies(
    prevCatalog.entries ?? [],
    nextCatalog.entries ?? [],
  );

  const row = await prisma.renovationCostCatalogVersion.create({
    data: {
      versionKey: input.versionKey.trim(),
      label: input.label.trim(),
      marketCode: nextCatalog.market ?? "CZ",
      approvalStatus: "DRAFT",
      isCurrent: false,
      catalogJson: nextCatalog as unknown as Prisma.InputJsonValue,
      previousVersionKey: previous?.versionKey ?? DEMO_COST_CATALOG_VERSION,
      changeReason: input.changeReason.trim(),
      anomalyFlags: anomalies as unknown as Prisma.InputJsonValue,
    },
  });

  await writeAuditLog({
    action: "admin.renovation.catalog.draft",
    entity: "RenovationCostCatalogVersion",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: {
      versionKey: row.versionKey,
      anomalyCount: anomalies.length,
    },
  });

  return { ok: true, id: row.id, anomalyCount: anomalies.length };
}

export async function approveRenovationCatalog(input: {
  versionId: string;
  actorUserId: string;
  reason: string;
  forceDespiteAnomalies?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 12) {
    return { ok: false, error: "Approval reason min. 12 characters." };
  }
  const row = await prisma.renovationCostCatalogVersion.findUnique({
    where: { id: input.versionId },
  });
  if (!row) return { ok: false, error: "Catalog version not found." };

  const anomalies = Array.isArray(row.anomalyFlags) ? row.anomalyFlags : [];
  if (anomalies.length > 0 && !input.forceDespiteAnomalies) {
    return {
      ok: false,
      error: `Catalog má ${anomalies.length} price-jump anomálií — použijte forceDespiteAnomalies po review.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.renovationCostCatalogVersion.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false, approvalStatus: "APPROVED" },
    });
    await tx.renovationCostCatalogVersion.update({
      where: { id: row.id },
      data: {
        isCurrent: true,
        approvalStatus: "ACTIVE",
        approvedAt: new Date(),
        approvedByUserId: input.actorUserId,
      },
    });
  });

  await writeAuditLog({
    action: "admin.renovation.catalog.activate",
    entity: "RenovationCostCatalogVersion",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: {
      versionKey: row.versionKey,
      reason: input.reason.trim().slice(0, 300),
      forced: Boolean(input.forceDespiteAnomalies),
    },
  });

  return { ok: true };
}
