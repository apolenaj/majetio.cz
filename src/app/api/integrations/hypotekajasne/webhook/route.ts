import { NextResponse } from "next/server";

import { processHypotekaJasneWebhook } from "@/domains/leads/service/webhook-handler";
import {
  applyPrivateCacheHeaders,
  rejectCorsPreflight,
  stripCorsHeaders,
} from "@/lib/security/http-privacy";
import { assertWebhookIpRateLimit } from "@/lib/security/rate-limit";
import { auditWebhookForgery } from "@/lib/security/security-audit";

export const dynamic = "force-dynamic";

function webhookJson(body: unknown, status = 200): NextResponse {
  const res = NextResponse.json(body, { status });
  applyPrivateCacheHeaders(res.headers);
  stripCorsHeaders(res.headers);
  return res;
}

/** Webhooks: no CORS — reject browser preflight. */
export function OPTIONS() {
  return rejectCorsPreflight();
}

/**
 * HypotekaJasne inbound webhook — signed, idempotent status updates.
 * POST body only — never accept PII via query string. No broad CORS.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  if ([...url.searchParams.keys()].length > 0) {
    return webhookJson(
      { error: "Query parameters are not allowed on webhook endpoint." },
      400,
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limited = await assertWebhookIpRateLimit(ip);
  if (!limited.ok) {
    return webhookJson({ error: "Too many requests" }, 429);
  }

  const rawBody = await request.text();
  const result = await processHypotekaJasneWebhook({
    rawBody,
    headers: request.headers,
  });

  if (!result.ok) {
    if (result.status === 401) {
      await auditWebhookForgery({
        provider: "hypotekajasne",
        reason: result.error,
        ip,
      });
    }
    return webhookJson({ error: result.error }, result.status);
  }

  return webhookJson({
    ok: true,
    duplicate: result.duplicate,
    correlationId: result.correlationId,
  });
}
