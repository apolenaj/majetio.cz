/**
 * Client-safe listing URL validation with SSRF hardening.
 * Does not fetch the URL — only validates before redirecting to the analysis flow.
 */

export type ListingUrlValidationResult =
  | { ok: true; url: string }
  | { ok: false; reason: "invalid" | "blocked" | "unsupported" };

const MAX_URL_LENGTH = 2048;

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

function isPrivateOrLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  if (
    host === "localhost" ||
    host === "localhost.localdomain" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]"
  ) {
    return true;
  }

  // IPv4 literals
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((n) => Number.isNaN(n) || n > 255)) return true;
    const [a, b] = octets as [number, number, number, number];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local / metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }

  // IPv6 literals (bracketed or bare) — block all for listing import
  if (host.includes(":")) return true;

  return false;
}

function isAllowedListingHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

/**
 * Validate a user-supplied listing URL for the homepage quick-entry form.
 * Blocks non-HTTPS, credentials, private/local hosts, and unknown portals.
 */
export function validateListingUrl(raw: string): ListingUrlValidationResult {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
    return { ok: false, reason: "invalid" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "invalid" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: "blocked" };
  }

  if (isPrivateOrLocalHostname(parsed.hostname)) {
    return { ok: false, reason: "blocked" };
  }

  // Block numeric hosts that resolve to metadata-like endpoints via odd forms
  if (parsed.hostname.toLowerCase() === "metadata.google.internal") {
    return { ok: false, reason: "blocked" };
  }

  if (!isAllowedListingHost(parsed.hostname)) {
    return { ok: false, reason: "unsupported" };
  }

  // Normalize: drop hash, keep query (listing IDs often live there)
  parsed.hash = "";

  return { ok: true, url: parsed.toString() };
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
