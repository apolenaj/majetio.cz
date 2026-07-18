/**
 * Idempotency keys for import jobs / source rows (Prompt 7 Part 4).
 */

import { createHash } from "node:crypto";

export function hashPayload(payload: unknown): string {
  const json = typeof payload === "string" ? payload : JSON.stringify(payload);
  return createHash("sha256").update(json).digest("hex");
}

/**
 * Preferred key: provider + external id.
 * Fallback: provider + payload hash (same payload → same key → no duplicate).
 */
export function buildItemIdempotencyKey(input: {
  provider: string;
  externalPropertyId?: string | null;
  payload?: unknown;
}): string {
  const provider = input.provider.trim().toLowerCase();
  if (input.externalPropertyId?.trim()) {
    return `${provider}:ext:${input.externalPropertyId.trim()}`;
  }
  return `${provider}:hash:${hashPayload(input.payload ?? {})}`;
}

export function buildJobIdempotencyKey(input: {
  provider: string;
  runKey: string;
}): string {
  return `job:${input.provider.trim().toLowerCase()}:${input.runKey.trim()}`;
}
