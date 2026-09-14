/**
 * External-safe correlation token for cross-system mortgage lead tracking.
 * Never expose internal Lead.id to partners or client URLs.
 */

import { randomBytes } from "node:crypto";

const CORRELATION_PREFIX = "ml_";

export function generateMortgageLeadCorrelationId(): string {
  return `${CORRELATION_PREFIX}${randomBytes(16).toString("base64url")}`;
}

export function isMortgageLeadCorrelationId(value: string): boolean {
  return value.startsWith(CORRELATION_PREFIX) && value.length >= 12;
}
