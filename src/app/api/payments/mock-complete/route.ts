import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { resolvePaymentsConfig, signPaymentsWebhookBody, isPaymentsMockAllowed } from "@/integrations/payments";
import { processPaymentWebhook } from "@/domains/payments/service/webhook-handler";

export const runtime = "nodejs";

/**
 * Dev helper: mock PSP completion → signed webhook.
 * Disabled unless PAYMENTS_PROVIDER=mock and mock is allowed (not bare production).
 */
export async function POST(request: Request) {
  const config = resolvePaymentsConfig();
  if (config.provider !== "mock" || !isPaymentsMockAllowed()) {
    return NextResponse.json({ error: "Mock provider disabled." }, { status: 403 });
  }
  if (!config.webhookSecret) {
    return NextResponse.json(
      { error: "Set PAYMENTS_WEBHOOK_SECRET for mock webhooks." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = z
    .object({
      orderId: z.string().min(1),
      providerPaymentId: z.string().min(1),
      type: z.enum([
        "payment.succeeded",
        "payment.failed",
        "payment.cancelled",
        "payment.refunded",
        "payment.chargeback",
      ]),
      amountMinor: z.number().int().nonnegative().optional(),
      reason: z.string().max(500).optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { amountGrossMinor: true, currency: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  await prisma.payment.updateMany({
    where: { providerPaymentId: parsed.data.providerPaymentId },
    data: { rawProviderStatus: "mock_redirect" },
  });

  const eventId = `mock_${parsed.data.type}_${parsed.data.providerPaymentId}_${Date.now()}`;
  const payload = JSON.stringify({
    eventId,
    type: parsed.data.type,
    providerPaymentId: parsed.data.providerPaymentId,
    orderId: parsed.data.orderId,
    amountMinor: parsed.data.amountMinor ?? order.amountGrossMinor,
    reason: parsed.data.reason ?? null,
    currency: order.currency,
  });
  const timestampUnix = Math.floor(Date.now() / 1000);
  const signature = signPaymentsWebhookBody({
    secret: config.webhookSecret,
    timestampUnix,
    body: payload,
  });

  const headers = new Headers({
    "content-type": "application/json",
    "x-majetio-payments-signature": signature,
    "x-majetio-payments-timestamp": String(timestampUnix),
  });

  const result = await processPaymentWebhook({
    rawBody: payload,
    headers,
    provider: "mock",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, duplicate: result.duplicate });
}
