import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Public liveness — process up only. No DB probe (see GET /api/ready).
 * HypotekaJasne snapshot is boolean/config flags only — never secrets.
 */
export async function GET() {
  const { getHypotekaJasneIntegrationStatus } = await import(
    "@/integrations/hypotekajasne"
  );

  return NextResponse.json(
    {
      status: "ok",
      service: "majetio",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      integrations: {
        hypotekajasne: getHypotekaJasneIntegrationStatus(),
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
