/**
 * Dataset Registry — governance metadata, DQ scores, lineage (spec 218–227).
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeOpsAuditLog } from "@/domains/administration/audit/ops-audit-log";

export const DATASET_HEALTH_STATUSES = [
  "HEALTHY",
  "STALE",
  "DEGRADED",
  "DISABLED",
] as const;
export type DatasetHealthStatus = (typeof DATASET_HEALTH_STATUSES)[number];

export const DATASET_UPDATE_FREQUENCIES = [
  "REALTIME",
  "HOURLY",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "MANUAL",
  "UNKNOWN",
] as const;
export type DatasetUpdateFrequency =
  (typeof DATASET_UPDATE_FREQUENCIES)[number];

export const DATASET_LINEAGE_KINDS = [
  "DERIVES_FROM",
  "ENRICHES",
  "JOINS",
  "VALIDATES",
  "MIRRORS",
] as const;
export type DatasetLineageKind = (typeof DATASET_LINEAGE_KINDS)[number];

export type DatasetRegistryItem = {
  id: string;
  key: string;
  name: string;
  source: string;
  ownerUserId: string | null;
  stewardUserId: string | null;
  updateFrequency: DatasetUpdateFrequency;
  qualitySlaMinutes: number | null;
  qualitySlaScoreMin: number | null;
  healthStatus: DatasetHealthStatus;
  lastRefreshedAt: Date | null;
  latestScore: number | null;
};

export function deriveHealthFromSla(input: {
  lastRefreshedAt: Date | null;
  qualitySlaMinutes: number | null;
  latestScore: number | null;
  qualitySlaScoreMin: number | null;
  now?: Date;
}): DatasetHealthStatus {
  const now = input.now ?? new Date();
  if (
    input.qualitySlaMinutes != null &&
    input.lastRefreshedAt != null
  ) {
    const ageMin =
      (now.getTime() - input.lastRefreshedAt.getTime()) / 60_000;
    if (ageMin > input.qualitySlaMinutes * 2) return "DEGRADED";
    if (ageMin > input.qualitySlaMinutes) return "STALE";
  } else if (
    input.qualitySlaMinutes != null &&
    input.lastRefreshedAt == null
  ) {
    return "STALE";
  }

  if (
    input.qualitySlaScoreMin != null &&
    input.latestScore != null &&
    input.latestScore < input.qualitySlaScoreMin
  ) {
    return "DEGRADED";
  }

  return "HEALTHY";
}

export async function listDatasets(input?: {
  healthStatus?: DatasetHealthStatus;
  take?: number;
}): Promise<{ items: DatasetRegistryItem[]; error: string | null }> {
  try {
    const where: Prisma.DatasetRegistryWhereInput = {};
    if (input?.healthStatus) where.healthStatus = input.healthStatus;

    const rows = await prisma.datasetRegistry.findMany({
      where,
      orderBy: { key: "asc" },
      take: Math.min(input?.take ?? 80, 200),
      include: {
        qualityScores: {
          orderBy: { scoredAt: "desc" },
          take: 1,
          select: { score: true },
        },
      },
    });

    return {
      items: rows.map((r) => ({
        id: r.id,
        key: r.key,
        name: r.name,
        source: r.source,
        ownerUserId: r.ownerUserId,
        stewardUserId: r.stewardUserId,
        updateFrequency: r.updateFrequency as DatasetUpdateFrequency,
        qualitySlaMinutes: r.qualitySlaMinutes,
        qualitySlaScoreMin: r.qualitySlaScoreMin,
        healthStatus: r.healthStatus as DatasetHealthStatus,
        lastRefreshedAt: r.lastRefreshedAt,
        latestScore: r.qualityScores[0]?.score ?? null,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Dataset list failed",
    };
  }
}

export async function upsertDataset(input: {
  key: string;
  name: string;
  source: string;
  description?: string | null;
  ownerUserId?: string | null;
  stewardUserId?: string | null;
  sourceRef?: string | null;
  updateFrequency?: DatasetUpdateFrequency;
  qualitySlaMinutes?: number | null;
  qualitySlaScoreMin?: number | null;
  marketCode?: string | null;
  tags?: string[];
  actorUserId: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!input.key.trim() || !input.name.trim() || !input.source.trim()) {
    return { ok: false, error: "key, name, and source are required." };
  }

  // Never accept credential-like sourceRef values
  if (
    input.sourceRef &&
    /(password|secret|api[_-]?key|token)=/i.test(input.sourceRef)
  ) {
    return {
      ok: false,
      error: "sourceRef must not contain credentials.",
    };
  }

  const existing = await prisma.datasetRegistry.findUnique({
    where: { key: input.key.trim() },
  });

  const row = await prisma.datasetRegistry.upsert({
    where: { key: input.key.trim() },
    create: {
      key: input.key.trim(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      source: input.source.trim(),
      sourceRef: input.sourceRef?.trim() || null,
      ownerUserId: input.ownerUserId ?? null,
      stewardUserId: input.stewardUserId ?? null,
      updateFrequency: input.updateFrequency ?? "UNKNOWN",
      qualitySlaMinutes: input.qualitySlaMinutes ?? null,
      qualitySlaScoreMin: input.qualitySlaScoreMin ?? null,
      marketCode: input.marketCode?.trim().toUpperCase() || null,
      tags: input.tags ?? [],
    },
    update: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      source: input.source.trim(),
      sourceRef: input.sourceRef?.trim() || null,
      ownerUserId: input.ownerUserId ?? null,
      stewardUserId: input.stewardUserId ?? null,
      updateFrequency: input.updateFrequency ?? undefined,
      qualitySlaMinutes: input.qualitySlaMinutes ?? undefined,
      qualitySlaScoreMin: input.qualitySlaScoreMin ?? undefined,
      marketCode: input.marketCode?.trim().toUpperCase() || null,
      tags: input.tags ?? undefined,
    },
  });

  await writeOpsAuditLog({
    action: existing ? "ops.dataset.update" : "ops.dataset.create",
    entityType: "DatasetRegistry",
    entityId: row.id,
    actorId: input.actorUserId,
    beforeSummary: existing
      ? `${existing.healthStatus} · ${existing.source}`
      : null,
    afterSummary: `${row.healthStatus} · ${row.source}`,
    meta: { key: row.key },
  });

  return { ok: true, id: row.id };
}

export async function recordDatasetQualityScore(input: {
  datasetId: string;
  score: number;
  completeness?: number | null;
  freshness?: number | null;
  consistency?: number | null;
  validity?: number | null;
  sampleSize?: number | null;
  notes?: string | null;
  scoredByUserId?: string | null;
  metrics?: Record<string, unknown> | null;
  refreshHealth?: boolean;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!(input.score >= 0 && input.score <= 100)) {
    return { ok: false, error: "score must be 0–100." };
  }

  const dataset = await prisma.datasetRegistry.findUnique({
    where: { id: input.datasetId },
  });
  if (!dataset) return { ok: false, error: "Dataset not found." };

  const row = await prisma.datasetQualityScore.create({
    data: {
      datasetId: input.datasetId,
      score: input.score,
      completeness: input.completeness ?? null,
      freshness: input.freshness ?? null,
      consistency: input.consistency ?? null,
      validity: input.validity ?? null,
      sampleSize: input.sampleSize ?? null,
      notes: input.notes?.trim() || null,
      scoredByUserId: input.scoredByUserId ?? null,
      metrics: (input.metrics ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    select: { id: true },
  });

  if (input.refreshHealth !== false) {
    const health = deriveHealthFromSla({
      lastRefreshedAt: dataset.lastRefreshedAt,
      qualitySlaMinutes: dataset.qualitySlaMinutes,
      latestScore: input.score,
      qualitySlaScoreMin: dataset.qualitySlaScoreMin,
    });
    if (health !== dataset.healthStatus && dataset.healthStatus !== "DISABLED") {
      await prisma.datasetRegistry.update({
        where: { id: dataset.id },
        data: { healthStatus: health },
      });
    }
  }

  return { ok: true, id: row.id };
}

export async function setDatasetHealth(input: {
  datasetId: string;
  healthStatus: DatasetHealthStatus;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "reason required." };
  }
  const row = await prisma.datasetRegistry.findUnique({
    where: { id: input.datasetId },
  });
  if (!row) return { ok: false, error: "Dataset not found." };

  await prisma.datasetRegistry.update({
    where: { id: row.id },
    data: { healthStatus: input.healthStatus },
  });

  await writeOpsAuditLog({
    action: "ops.dataset.health",
    entityType: "DatasetRegistry",
    entityId: row.id,
    actorId: input.actorUserId,
    reason: input.reason,
    beforeSummary: row.healthStatus,
    afterSummary: input.healthStatus,
    meta: { key: row.key },
  });

  return { ok: true };
}

export async function addDatasetLineage(input: {
  upstreamDatasetId: string;
  downstreamDatasetId: string;
  kind?: DatasetLineageKind;
  notes?: string | null;
  actorUserId: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.upstreamDatasetId === input.downstreamDatasetId) {
    return { ok: false, error: "Self-lineage is not allowed." };
  }

  try {
    const row = await prisma.datasetLineage.create({
      data: {
        upstreamDatasetId: input.upstreamDatasetId,
        downstreamDatasetId: input.downstreamDatasetId,
        kind: input.kind ?? "DERIVES_FROM",
        notes: input.notes?.trim() || null,
      },
      select: { id: true },
    });

    await writeOpsAuditLog({
      action: "ops.dataset.lineage.add",
      entityType: "DatasetLineage",
      entityId: row.id,
      actorId: input.actorUserId,
      meta: {
        upstreamDatasetId: input.upstreamDatasetId,
        downstreamDatasetId: input.downstreamDatasetId,
        kind: input.kind ?? "DERIVES_FROM",
      },
    });

    return { ok: true, id: row.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Lineage create failed",
    };
  }
}

export async function getDatasetLineageGraph(datasetId: string) {
  try {
    const [upstream, downstream] = await Promise.all([
      prisma.datasetLineage.findMany({
        where: { downstreamDatasetId: datasetId },
        include: {
          upstream: { select: { id: true, key: true, name: true } },
        },
      }),
      prisma.datasetLineage.findMany({
        where: { upstreamDatasetId: datasetId },
        include: {
          downstream: { select: { id: true, key: true, name: true } },
        },
      }),
    ]);
    return { upstream, downstream, error: null as string | null };
  } catch (err) {
    return {
      upstream: [],
      downstream: [],
      error: err instanceof Error ? err.message : "Lineage query failed",
    };
  }
}
