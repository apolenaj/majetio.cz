import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { buildAccountExport } from "@/lib/account/export";
import { exportToCsv } from "@/lib/account/export-csv";
import { consumePrivacyExportToken } from "@/domains/privacy/consent-records-service";

export const dynamic = "force-dynamic";

/**
 * Authenticated one-time export download.
 * No public URL with payload — requires session + unused token from Privacy Center.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let token: string | undefined;
  try {
    const body = (await request.json()) as { token?: string };
    token = body.token;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const consumed = await consumePrivacyExportToken({
    userId: session.user.id,
    token,
  });
  if (!consumed.ok) {
    return NextResponse.json({ error: consumed.error }, { status: 403 });
  }

  const exported = await buildAccountExport(consumed.format);
  if (!exported.ok) {
    return NextResponse.json({ error: exported.error }, { status: 500 });
  }

  if (consumed.format === "csv") {
    const csv = exportToCsv(exported.data);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="majetio-export.csv"',
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(JSON.stringify(exported.data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="majetio-export.json"',
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Export není dostupný přes GET. Použijte Privacy Center (POST + one-time token).",
    },
    { status: 405 },
  );
}
