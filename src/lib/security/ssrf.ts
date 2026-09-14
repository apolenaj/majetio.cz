/**
 * SSRF guards — allowlist hosts, block localhost / private IP / cloud metadata.
 * Use before ANY server-side fetch of a user- or partner-supplied URL.
 */

export type SsrfCheckResult =
  | { ok: true; url: URL }
  | { ok: false; reason: "invalid" | "blocked" | "unsupported" };

const METADATA_HOSTS = new Set([
  "metadata.google.internal",
  "metadata.goog",
  "169.254.169.254",
  "metadata",
]);

/** Well-known cloud metadata / link-local. */
export function isPrivateOrLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");

  if (METADATA_HOSTS.has(host)) return true;

  if (
    host === "localhost" ||
    host === "localhost.localdomain" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "0" ||
    host === "127.0.0.1"
  ) {
    return true;
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((n) => Number.isNaN(n) || n > 255)) return true;
    const [a, b] = octets as [number, number, number, number];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }

  // Block all IPv6 literals for user-supplied URLs
  if (host.includes(":")) return true;

  return false;
}

export function hostMatchesAllowlist(
  hostname: string,
  allowedSuffixes: readonly string[],
): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return allowedSuffixes.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

export type AssertSafeUrlOptions = {
  /** Require HTTPS (default true). */
  httpsOnly?: boolean;
  /** If set, hostname must match one of these suffixes. */
  allowlistSuffixes?: readonly string[];
  maxLength?: number;
  /** Allow http:// for local tests only when explicitly enabled. */
  allowHttpInDev?: boolean;
};

/**
 * Parse + validate a URL for outbound fetch. Does not perform DNS — callers
 * should still avoid following redirects to private IPs (redirect: 'error').
 */
export function assertSafeOutboundUrl(
  raw: string,
  opts: AssertSafeUrlOptions = {},
): SsrfCheckResult {
  const maxLength = opts.maxLength ?? 2048;
  const httpsOnly = opts.httpsOnly ?? true;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return { ok: false, reason: "invalid" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  const allowHttp =
    opts.allowHttpInDev && process.env.NODE_ENV !== "production";
  if (httpsOnly && parsed.protocol !== "https:") {
    if (!(allowHttp && parsed.protocol === "http:")) {
      return { ok: false, reason: "invalid" };
    }
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: "blocked" };
  }

  if (isPrivateOrLocalHostname(parsed.hostname)) {
    return { ok: false, reason: "blocked" };
  }

  if (
    opts.allowlistSuffixes &&
    opts.allowlistSuffixes.length > 0 &&
    !hostMatchesAllowlist(parsed.hostname, opts.allowlistSuffixes)
  ) {
    return { ok: false, reason: "unsupported" };
  }

  parsed.hash = "";
  return { ok: true, url: parsed };
}
