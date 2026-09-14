import { NextResponse } from "next/server";

import { probeDatabase } from "@/domains/operations/monitoring/system-health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public readiness — DB only, no secrets / queue depths / provider configs.
 * Use for load-balancer readiness. Liveness remains GET /api/health.
 */
export async function GET() {
  const db = await probeDatabase();
  const ready = db.status === "UP";

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      checks: {
        database: ready ? "up" : "down",
      },
      // Safe latency only — no connection strings / error stacks in prod body
      latencyMs: db.latencyMs,
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
