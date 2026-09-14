/**
 * Request correlation — propagate x-request-id across HTTP → logs → jobs.
 * Edge-safe (no node:crypto) — uses Web Crypto.
 */

import { headers } from "next/headers";

export const REQUEST_ID_HEADER = "x-request-id";
export const CORRELATION_ID_HEADER = "x-correlation-id";

const ID_RE = /^[a-zA-Z0-9._-]{8,128}$/;

export function normalizeCorrelationId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return ID_RE.test(trimmed) ? trimmed : null;
}

function mintRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Prefer inbound client/proxy id; otherwise mint a new UUID. */
export function resolveOrCreateRequestId(incoming: string | null | undefined): string {
  return normalizeCorrelationId(incoming) ?? mintRequestId();
}

/** Read correlation id from Next request headers (App Router). */
export async function getRequestCorrelationId(): Promise<string | null> {
  try {
    const h = await headers();
    return (
      normalizeCorrelationId(h.get(REQUEST_ID_HEADER)) ??
      normalizeCorrelationId(h.get(CORRELATION_ID_HEADER))
    );
  } catch {
    return null;
  }
}
