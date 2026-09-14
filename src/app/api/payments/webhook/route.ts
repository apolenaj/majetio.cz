import { NextResponse } from "next/server";

import { processPaymentWebhook } from "@/domains/payments/service/webhook-handler";
import { assertWebhookIpRateLimit } from "@/lib/security/rate-limit";
import { logger } from "@/lib/security/logger";
import {
  applyPrivateCacheHeaders,
  rejectCorsPreflight,
  stripCorsHeaders,
} from "@/lib/security/http-privacy";
import { auditWebhookForgery } from "@/lib/security/security-audit";

export const runtime = "nodejs";

const MAX_WEBHOOK_BYTES = 256 * 1024;

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
 * Payment provider webhook — signature verified, idempotent, rate-limited.
 * Secrets never exposed to client. No Access-Control-Allow-Origin.
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limited = await assertWebhookIpRateLimit(ip);
  if (!limited.ok) {
    return webhookJson(
      { error: "Too many requests" },
      429,
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_WEBHOOK_BYTES) {
    return webhookJson({ error: "Payload too large" }, 413);
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_WEBHOOK_BYTES) {
    return webhookJson({ error: "Payload too large" }, 413);
  }

  const result = await processPaymentWebhook({
    rawBody,
    headers: request.headers,
  });

  if (!result.ok) {
    if (result.status === 401) {
      await auditWebhookForgery({
        provider: "payments",
        reason: result.error,
        ip,
      });
    }
    logger.warn("payment_webhook_rejected", {
      status: result.status,
      // no rawBody / signatures
    });
    return webhookJson({ error: result.error }, result.status);
  }

  return webhookJson({
    ok: true,
    duplicate: result.duplicate,
    orderId: result.orderId,
  });
}
