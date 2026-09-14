/**
 * HMAC request signing for server-to-server HypotekaJasne integration.
 * Secrets live in server env only — never in client bundles.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const MAJETIO_SIGNATURE_HEADER = "x-majetio-signature";
export const MAJETIO_TIMESTAMP_HEADER = "x-majetio-timestamp";

export const PARTNER_SIGNATURE_HEADER = "x-hypotekajasne-signature";
export const PARTNER_TIMESTAMP_HEADER = "x-hypotekajasne-timestamp";
export const PARTNER_EVENT_ID_HEADER = "x-hypotekajasne-event-id";

const SIGNATURE_VERSION = "v1";

export type SignedRequestHeaders = {
  [MAJETIO_TIMESTAMP_HEADER]: string;
  [MAJETIO_SIGNATURE_HEADER]: string;
};

export function signRequestBody(input: {
  secret: string;
  timestampUnix: number;
  body: string;
}): string {
  const payload = `${input.timestampUnix}.${input.body}`;
  const digest = createHmac("sha256", input.secret).update(payload).digest("hex");
  return `t=${input.timestampUnix},${SIGNATURE_VERSION}=${digest}`;
}

export function buildSignedRequestHeaders(input: {
  secret: string;
  body: string;
  now?: number;
}): SignedRequestHeaders {
  const timestampUnix = Math.floor((input.now ?? Date.now()) / 1000);
  return {
    [MAJETIO_TIMESTAMP_HEADER]: String(timestampUnix),
    [MAJETIO_SIGNATURE_HEADER]: signRequestBody({
      secret: input.secret,
      timestampUnix,
      body: input.body,
    }),
  };
}

export type SignatureVerificationResult =
  | { ok: true; timestampUnix: number }
  | { ok: false; reason: string };

export function verifySignedRequest(input: {
  secret: string;
  body: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  toleranceSeconds?: number;
  now?: number;
}): SignatureVerificationResult {
  const tolerance = input.toleranceSeconds ?? 300;
  const signatureHeader = input.signatureHeader?.trim();
  const timestampHeader = input.timestampHeader?.trim();

  if (!signatureHeader || !timestampHeader) {
    return { ok: false, reason: "Missing signature or timestamp header." };
  }

  const timestampUnix = Number.parseInt(timestampHeader, 10);
  if (!Number.isFinite(timestampUnix)) {
    return { ok: false, reason: "Invalid timestamp header." };
  }

  const nowUnix = Math.floor((input.now ?? Date.now()) / 1000);
  if (Math.abs(nowUnix - timestampUnix) > tolerance) {
    return { ok: false, reason: "Timestamp outside tolerance window (replay?)." };
  }

  const expectedSignature = signRequestBody({
    secret: input.secret,
    timestampUnix,
    body: input.body,
  });

  const receivedDigest = parseSignatureDigest(signatureHeader);
  const expectedDigest = parseSignatureDigest(expectedSignature);

  if (!expectedDigest || !receivedDigest) {
    return { ok: false, reason: "Malformed signature header." };
  }

  if (expectedSignature.trim() !== signatureHeader.trim()) {
    return { ok: false, reason: "Signature mismatch." };
  }

  const expectedBuf = Buffer.from(expectedDigest, "hex");
  const receivedBuf = Buffer.from(receivedDigest, "hex");
  if (
    expectedBuf.length !== receivedBuf.length ||
    !timingSafeEqual(expectedBuf, receivedBuf)
  ) {
    return { ok: false, reason: "Signature mismatch." };
  }

  return { ok: true, timestampUnix };
}

function parseSignatureDigest(header: string): string | null {
  const parts = header.split(",");
  for (const part of parts) {
    const [version, digest] = part.split("=");
    if (version?.trim() === SIGNATURE_VERSION && digest?.trim()) {
      return digest.trim();
    }
  }
  return null;
}
