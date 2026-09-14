/**
 * HMAC webhook signing for payment providers (server-only).
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const PAYMENTS_SIGNATURE_HEADER = "x-majetio-payments-signature";
export const PAYMENTS_TIMESTAMP_HEADER = "x-majetio-payments-timestamp";
export const PAYMENTS_EVENT_ID_HEADER = "x-majetio-payments-event-id";

const SIGNATURE_VERSION = "v1";

export function signPaymentsWebhookBody(input: {
  secret: string;
  timestampUnix: number;
  body: string;
}): string {
  const payload = `${input.timestampUnix}.${input.body}`;
  const digest = createHmac("sha256", input.secret).update(payload).digest("hex");
  return `t=${input.timestampUnix},${SIGNATURE_VERSION}=${digest}`;
}

export function verifyPaymentsWebhookSignature(input: {
  secret: string;
  body: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  toleranceSeconds: number;
  now?: number;
}): { ok: true } | { ok: false; reason: string } {
  if (!input.signatureHeader || !input.timestampHeader) {
    return { ok: false, reason: "Missing signature or timestamp header." };
  }
  const ts = Number(input.timestampHeader);
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: "Invalid timestamp." };
  }
  const nowSec = Math.floor((input.now ?? Date.now()) / 1000);
  if (Math.abs(nowSec - ts) > input.toleranceSeconds) {
    return { ok: false, reason: "Timestamp outside tolerance." };
  }

  const expected = signPaymentsWebhookBody({
    secret: input.secret,
    timestampUnix: ts,
    body: input.body,
  });

  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(input.signatureHeader);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "Invalid signature." };
    }
  } catch {
    return { ok: false, reason: "Invalid signature encoding." };
  }
  return { ok: true };
}
