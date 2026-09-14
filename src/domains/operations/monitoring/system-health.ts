/**
 * System component health probes (139–150).
 */

import { prisma } from "@/lib/db";

export const SYSTEM_COMPONENT_KINDS = [
  "DATABASE",
  "QUEUE",
  "PAYMENTS",
  "SEARCH",
  "EXTERNAL_PROVIDER",
] as const;

export type SystemComponentKind = (typeof SYSTEM_COMPONENT_KINDS)[number];

export const SYSTEM_HEALTH_STATUSES = [
  "UP",
  "DEGRADED",
  "DOWN",
  "UNKNOWN",
] as const;

export type SystemComponentHealthStatus =
  (typeof SYSTEM_HEALTH_STATUSES)[number];

export type ComponentHealthResult = {
  component: SystemComponentKind;
  componentKey: string;
  status: SystemComponentHealthStatus;
  latencyMs: number | null;
  message: string | null;
  checkedAt: string;
};

export type SystemHealthReport = {
  overall: SystemComponentHealthStatus;
  components: ComponentHealthResult[];
};

function worst(
  a: SystemComponentHealthStatus,
  b: SystemComponentHealthStatus,
): SystemComponentHealthStatus {
  const rank: Record<SystemComponentHealthStatus, number> = {
    UP: 0,
    DEGRADED: 1,
    UNKNOWN: 2,
    DOWN: 3,
  };
  return rank[b] > rank[a] ? b : a;
}

async function timed<T>(
  fn: () => Promise<T>,
): Promise<{ ok: true; value: T; ms: number } | { ok: false; ms: number; error: string }> {
  const start = Date.now();
  try {
    const value = await fn();
    return { ok: true, value, ms: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      ms: Date.now() - start,
      error: err instanceof Error ? err.message : "probe failed",
    };
  }
}

export async function probeDatabase(): Promise<ComponentHealthResult> {
  const result = await timed(() => prisma.$queryRaw`SELECT 1`);
  return {
    component: "DATABASE",
    componentKey: "postgres",
    status: result.ok ? "UP" : "DOWN",
    latencyMs: result.ms,
    message: result.ok ? null : result.error,
    checkedAt: new Date().toISOString(),
  };
}

export async function probeQueue(): Promise<ComponentHealthResult> {
  const result = await timed(async () => {
    const [queued, failed, dlq] = await Promise.all([
      prisma.systemJob.count({
        where: { status: { in: ["QUEUED", "RETRYING"] } },
      }),
      prisma.systemJob.count({ where: { status: "FAILED" } }),
      prisma.systemJobDeadLetter.count({
        where: { requeuedAt: null },
      }),
    ]);
    return { queued, failed, dlq };
  });

  if (!result.ok) {
    return {
      component: "QUEUE",
      componentKey: "system_job",
      status: "UNKNOWN",
      latencyMs: result.ms,
      message: result.error,
      checkedAt: new Date().toISOString(),
    };
  }

  const { queued, failed, dlq } = result.value;
  let status: SystemComponentHealthStatus = "UP";
  if (dlq > 0 || failed > 20) status = "DEGRADED";
  if (queued > 500) status = "DEGRADED";

  return {
    component: "QUEUE",
    componentKey: "system_job",
    status,
    latencyMs: result.ms,
    message: `queued=${queued} failed=${failed} dlq=${dlq}`,
    checkedAt: new Date().toISOString(),
  };
}

export async function probePayments(): Promise<ComponentHealthResult> {
  const result = await timed(async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failed = await prisma.payment.count({
      where: { status: "FAILED", createdAt: { gte: since } },
    });
    return failed;
  });

  if (!result.ok) {
    return {
      component: "PAYMENTS",
      componentKey: "payment",
      status: "UNKNOWN",
      latencyMs: result.ms,
      message: result.error,
      checkedAt: new Date().toISOString(),
    };
  }

  const failed = result.value;
  return {
    component: "PAYMENTS",
    componentKey: "payment",
    status: failed > 50 ? "DEGRADED" : "UP",
    latencyMs: result.ms,
    message: `failed_24h=${failed}`,
    checkedAt: new Date().toISOString(),
  };
}

export async function probeSearch(): Promise<ComponentHealthResult> {
  const result = await timed(async () => {
    // Lightweight index probe — property count with limit
    await prisma.property.findFirst({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
  });

  return {
    component: "SEARCH",
    componentKey: "property_index",
    status: result.ok ? "UP" : "DOWN",
    latencyMs: result.ms,
    message: result.ok ? null : result.error,
    checkedAt: new Date().toISOString(),
  };
}

export async function probeExternalProviders(): Promise<ComponentHealthResult[]> {
  const out: ComponentHealthResult[] = [];

  // HypotekaJasne — status without calling network if possible
  try {
    const { getHypotekaJasneIntegrationStatus } = await import(
      "@/integrations/hypotekajasne"
    );
    const st = getHypotekaJasneIntegrationStatus();
    const configured =
      typeof st === "object" && st != null && "configured" in st
        ? Boolean((st as { configured?: boolean }).configured)
        : true;
    out.push({
      component: "EXTERNAL_PROVIDER",
      componentKey: "hypotekajasne",
      status: configured ? "UP" : "DEGRADED",
      latencyMs: null,
      message: configured ? "configured" : "not configured",
      checkedAt: new Date().toISOString(),
    });
  } catch {
    out.push({
      component: "EXTERNAL_PROVIDER",
      componentKey: "hypotekajasne",
      status: "UNKNOWN",
      latencyMs: null,
      message: "status helper unavailable",
      checkedAt: new Date().toISOString(),
    });
  }

  return out;
}

export async function buildSystemHealthReport(): Promise<SystemHealthReport> {
  const [db, queue, payments, search, externals] = await Promise.all([
    probeDatabase(),
    probeQueue().catch(
      (): ComponentHealthResult => ({
        component: "QUEUE",
        componentKey: "system_job",
        status: "UNKNOWN",
        latencyMs: null,
        message: "SystemJob table may be missing (migrate first)",
        checkedAt: new Date().toISOString(),
      }),
    ),
    probePayments(),
    probeSearch(),
    probeExternalProviders(),
  ]);

  const components = [db, queue, payments, search, ...externals];
  let overall: SystemComponentHealthStatus = "UP";
  for (const c of components) {
    overall = worst(overall, c.status);
  }

  // Best-effort persist probes
  try {
    for (const c of components) {
      await prisma.systemHealthProbe.upsert({
        where: {
          component_componentKey: {
            component: c.component,
            componentKey: c.componentKey,
          },
        },
        create: {
          component: c.component,
          componentKey: c.componentKey,
          status: c.status,
          latencyMs: c.latencyMs,
          message: c.message,
          checkedAt: new Date(c.checkedAt),
        },
        update: {
          status: c.status,
          latencyMs: c.latencyMs,
          message: c.message,
          checkedAt: new Date(c.checkedAt),
        },
      });
    }
  } catch {
    // table may not exist yet
  }

  return { overall, components };
}
