/**
 * Source Management + Data Freshness Center.
 */

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import {
  DEFAULT_STALE_AFTER_DAYS,
  DEFAULT_UNAVAILABLE_AFTER_DAYS,
  evaluatePropertyFreshness,
} from "@/lib/properties/freshness";
import type { SourceHealthStatus } from "@/domains/property-sources/admin/health";
import {
  computeSourceHealth,
  isLicenseExpired,
} from "@/domains/property-sources/admin/health";

export type ProviderOpsRow = {
  provider: string;
  displayName: string | null;
  sourceCount: number;
  healthStatus: SourceHealthStatus;
  licenseStatus: string;
  licenseExpiresAt: Date | null;
  importEnabled: boolean;
  frontendVisible: boolean;
  notes: string | null;
  staleSourceCount: number;
};

export async function listProviderOps(): Promise<{
  items: ProviderOpsRow[];
  error: string | null;
}> {
  try {
    const [grouped, configs] = await Promise.all([
      prisma.propertySource.groupBy({
        by: ["provider"],
        _count: { _all: true },
        _max: { lastSeenAt: true, licenseExpiresAt: true },
      }),
      prisma.dataSourceProviderConfig.findMany(),
    ]);

    const configByProvider = new Map(
      configs.map((c) => [c.provider.toLowerCase(), c]),
    );

    const staleCutoff = new Date();
    staleCutoff.setDate(staleCutoff.getDate() - DEFAULT_STALE_AFTER_DAYS);

    const items: ProviderOpsRow[] = [];
    for (const g of grouped) {
      const cfg = configByProvider.get(g.provider.toLowerCase());
      const staleSourceCount = await prisma.propertySource.count({
        where: {
          provider: g.provider,
          lastSeenAt: { lt: staleCutoff },
        },
      });

      const licenseExpiresAt =
        cfg?.licenseExpiresAt ?? g._max.licenseExpiresAt ?? null;
      const importEnabled = cfg?.importEnabled ?? true;
      const frontendVisible = cfg?.frontendVisible ?? true;
      const licenseStatus = cfg?.licenseStatus ?? "UNKNOWN";

      const health = computeSourceHealth({
        configuredHealth: (cfg?.healthStatus as SourceHealthStatus) ?? null,
        importEnabled,
        licenseExpiresAt,
        lastSeenAt: g._max.lastSeenAt,
        staleSourceRatio:
          g._count._all > 0 ? staleSourceCount / g._count._all : 0,
      });

      items.push({
        provider: g.provider,
        displayName: cfg?.displayName ?? null,
        sourceCount: g._count._all,
        healthStatus: health,
        licenseStatus,
        licenseExpiresAt,
        importEnabled,
        frontendVisible,
        notes: cfg?.notes ?? null,
        staleSourceCount,
      });
    }

    items.sort((a, b) => b.sourceCount - a.sourceCount);
    return { items, error: null };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Provider list failed",
    };
  }
}

export async function upsertProviderGovernance(input: {
  provider: string;
  displayName?: string | null;
  healthStatus?: SourceHealthStatus;
  licenseStatus?: string;
  licenseExpiresAt?: Date | null;
  importEnabled?: boolean;
  frontendVisible?: boolean;
  notes?: string | null;
  actorUserId: string;
  /** When license expired / disabled — also stamp PropertySource rows. */
  cascadeToSources?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const provider = input.provider.trim();
  if (!provider) return { ok: false, error: "Provider is required." };

  const healthStatus = input.healthStatus ?? "HEALTHY";
  const importEnabled = input.importEnabled ?? true;
  const frontendVisible = input.frontendVisible ?? true;

  await prisma.dataSourceProviderConfig.upsert({
    where: { provider },
    create: {
      provider,
      displayName: input.displayName ?? null,
      healthStatus: healthStatus as never,
      licenseStatus: (input.licenseStatus ?? "UNKNOWN") as never,
      licenseExpiresAt: input.licenseExpiresAt ?? null,
      importEnabled,
      frontendVisible,
      notes: input.notes ?? null,
      updatedByUserId: input.actorUserId,
    },
    update: {
      displayName: input.displayName ?? undefined,
      healthStatus: healthStatus as never,
      licenseStatus: input.licenseStatus
        ? (input.licenseStatus as never)
        : undefined,
      licenseExpiresAt: input.licenseExpiresAt,
      importEnabled,
      frontendVisible,
      notes: input.notes ?? undefined,
      updatedByUserId: input.actorUserId,
    },
  });

  if (input.cascadeToSources) {
    await prisma.propertySource.updateMany({
      where: { provider },
      data: {
        importEnabled,
        frontendVisible,
        healthStatus: healthStatus as never,
        licenseExpiresAt: input.licenseExpiresAt ?? undefined,
      },
    });
  }

  await writeAuditLog({
    action: "admin.source.provider.governance",
    entity: "DataSourceProviderConfig",
    entityId: provider,
    actorId: input.actorUserId,
    meta: {
      healthStatus,
      importEnabled,
      frontendVisible,
      licenseExpiresAt: input.licenseExpiresAt?.toISOString() ?? null,
      cascadeToSources: Boolean(input.cascadeToSources),
    },
  });

  return { ok: true };
}

/**
 * Stop import + hide frontend when license expired (governance action).
 */
export async function enforceExpiredLicense(input: {
  provider: string;
  actorUserId: string;
}): Promise<{ ok: true; affectedSources: number } | { ok: false; error: string }> {
  const cfg = await prisma.dataSourceProviderConfig.findUnique({
    where: { provider: input.provider },
  });
  const expiresAt = cfg?.licenseExpiresAt ?? null;
  if (!isLicenseExpired(expiresAt)) {
    return {
      ok: false,
      error: "Licence ještě nevypršela (nebo není nastaveno licenseExpiresAt).",
    };
  }

  const result = await upsertProviderGovernance({
    provider: input.provider,
    healthStatus: "DISABLED",
    importEnabled: false,
    frontendVisible: false,
    licenseExpiresAt: expiresAt,
    notes: `Licence expired — enforced ${new Date().toISOString()}`,
    actorUserId: input.actorUserId,
    cascadeToSources: true,
  });
  if (!result.ok) return result;

  const affectedSources = await prisma.propertySource.count({
    where: { provider: input.provider },
  });
  return { ok: true, affectedSources };
}

export type FreshnessCenterSummary = {
  freshCount: number;
  staleCount: number;
  unavailableCount: number;
  staleAffectedProperties: number;
  unavailableAffectedProperties: number;
  staleAfterDays: number;
  unavailableAfterDays: number;
  alerts: Array<{
    code: string;
    severity: "CRITICAL" | "WARNING" | "INFO";
    message: string;
    affectedCount: number;
  }>;
};

export async function buildDataFreshnessCenter(): Promise<{
  summary: FreshnessCenterSummary;
  error: string | null;
}> {
  try {
    const [freshCount, staleCount, unavailableCount] = await Promise.all([
      prisma.property.count({ where: { freshness: "FRESH", isDemo: false } }),
      prisma.property.count({ where: { freshness: "STALE", isDemo: false } }),
      prisma.property.count({
        where: { freshness: "UNAVAILABLE", isDemo: false },
      }),
    ]);

    const alerts: FreshnessCenterSummary["alerts"] = [];
    if (staleCount > 0) {
      alerts.push({
        code: "STALE_PROPERTIES",
        severity: staleCount >= 1000 ? "CRITICAL" : "WARNING",
        message: `${staleCount.toLocaleString("cs-CZ")} properties affected — data stárnou (STALE ≥ ${DEFAULT_STALE_AFTER_DAYS} dní bez potvrzení zdroje).`,
        affectedCount: staleCount,
      });
    }
    if (unavailableCount > 0) {
      alerts.push({
        code: "UNAVAILABLE_PROPERTIES",
        severity: "CRITICAL",
        message: `${unavailableCount.toLocaleString("cs-CZ")} properties affected — zdroje mlčí ≥ ${DEFAULT_UNAVAILABLE_AFTER_DAYS} dní (UNAVAILABLE).`,
        affectedCount: unavailableCount,
      });
    }

    // Sample evaluation sanity (optional consistency check)
    const sample = await prisma.property.findMany({
      where: { isDemo: false, status: "ACTIVE" },
      select: { lastSeenAt: true, freshness: true },
      take: 20,
      orderBy: { lastSeenAt: "asc" },
    });
    let drift = 0;
    for (const p of sample) {
      const d = evaluatePropertyFreshness({ lastSeenAt: p.lastSeenAt });
      if (d.freshness !== p.freshness) drift += 1;
    }
    if (drift > 0) {
      alerts.push({
        code: "FRESHNESS_DRIFT",
        severity: "INFO",
        message: `${drift} z ${sample.length} vzorků ACTIVE má neaktuální freshness flag — spusťte freshness cron.`,
        affectedCount: drift,
      });
    }

    return {
      summary: {
        freshCount,
        staleCount,
        unavailableCount,
        staleAffectedProperties: staleCount,
        unavailableAffectedProperties: unavailableCount,
        staleAfterDays: DEFAULT_STALE_AFTER_DAYS,
        unavailableAfterDays: DEFAULT_UNAVAILABLE_AFTER_DAYS,
        alerts,
      },
      error: null,
    };
  } catch (err) {
    return {
      summary: {
        freshCount: 0,
        staleCount: 0,
        unavailableCount: 0,
        staleAffectedProperties: 0,
        unavailableAffectedProperties: 0,
        staleAfterDays: DEFAULT_STALE_AFTER_DAYS,
        unavailableAfterDays: DEFAULT_UNAVAILABLE_AFTER_DAYS,
        alerts: [],
      },
      error: err instanceof Error ? err.message : "Freshness center failed",
    };
  }
}

/** Guard for workers: may this provider/source be imported? */
export function mayImportFromSource(input: {
  providerConfig?: {
    importEnabled: boolean;
    healthStatus: string;
    licenseExpiresAt?: Date | null;
  } | null;
  source?: {
    importEnabled?: boolean;
    healthStatus?: string;
    licenseExpiresAt?: Date | null;
  } | null;
}): boolean {
  if (input.providerConfig) {
    if (!input.providerConfig.importEnabled) return false;
    if (input.providerConfig.healthStatus === "DISABLED") return false;
    if (isLicenseExpired(input.providerConfig.licenseExpiresAt)) return false;
  }
  if (input.source) {
    if (input.source.importEnabled === false) return false;
    if (input.source.healthStatus === "DISABLED") return false;
    if (isLicenseExpired(input.source.licenseExpiresAt)) return false;
  }
  return true;
}
