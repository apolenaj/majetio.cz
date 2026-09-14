/**
 * Client-safe listing URL validation with SSRF hardening.
 * Does not fetch the URL — only validates before redirecting to the analysis flow.
 */

import {
  assertSafeOutboundUrl,
  isPrivateOrLocalHostname,
} from "@/lib/security/ssrf";

export type ListingUrlValidationResult =
  | { ok: true; url: string }
  | { ok: false; reason: "invalid" | "blocked" | "unsupported" };

/** Hostnames we accept for future import (Czech portals + common https hosts). */
const ALLOWED_HOST_SUFFIXES = [
  "sreality.cz",
  "bezrealitky.cz",
  "idnes.cz",
  "reality.idnes.cz",
  "ulovdomov.cz",
  "reality.cz",
  "ceskereality.cz",
  "mmreality.cz",
  "remax.cz",
  "century21.cz",
  "svoboda-williams.com",
  "engelvoelkers.com",
  "bidli.cz",
  "byty.cz",
  "dumrealit.cz",
] as const;

/**
 * Validate a user-supplied listing URL for the homepage quick-entry form.
 * Blocks non-HTTPS, credentials, private/local hosts, and unknown portals.
 */
export function validateListingUrl(raw: string): ListingUrlValidationResult {
  const checked = assertSafeOutboundUrl(raw, {
    allowlistSuffixes: ALLOWED_HOST_SUFFIXES,
  });
  if (!checked.ok) return { ok: false, reason: checked.reason };
  return { ok: true, url: checked.url.toString() };
}

export function buildAnalysisEntryHref(options: {
  source: "url" | "manual";
  listingUrl?: string;
}): string {
  const params = new URLSearchParams();
  params.set("source", options.source);
  if (options.listingUrl) {
    params.set("listingUrl", options.listingUrl);
  }
  return `/analyza/nova?${params.toString()}`;
}

export { isPrivateOrLocalHostname };
