/**
 * Server-only SSRF-safe fetch — DNS rebinding mitigation via node:dns.
 * Do not import from Client Components (use assertSafeOutboundUrl from ssrf.ts).
 */

import {
  assertSafeOutboundUrl,
  isPrivateOrLocalHostname,
} from "@/lib/security/ssrf";

/**
 * Safe fetch wrapper — validates URL (blocks localhost / private nets),
 * resolves DNS once and rejects private answers (DNS rebinding mitigation),
 * disables redirects, sets timeout. Prefer allowlistSuffixes for user input.
 */
export async function safeFetch(
  rawUrl: string,
  init: RequestInit & {
    allowlistSuffixes?: readonly string[];
    timeoutMs?: number;
    httpsOnly?: boolean;
    allowHttpInDev?: boolean;
  } = {},
): Promise<Response> {
  const {
    allowlistSuffixes,
    timeoutMs = 8_000,
    httpsOnly,
    allowHttpInDev,
    ...rest
  } = init;

  const checked = assertSafeOutboundUrl(rawUrl, {
    allowlistSuffixes,
    httpsOnly,
    allowHttpInDev,
  });
  if (!checked.ok) {
    throw new Error(`SSRF_BLOCKED:${checked.reason}`);
  }

  // DNS rebinding: resolve once before connect; reject private/link-local answers.
  try {
    const { lookup } = await import("node:dns/promises");
    const answers = await lookup(checked.url.hostname, { all: true });
    for (const ans of answers) {
      if (isPrivateOrLocalHostname(ans.address)) {
        throw new Error("SSRF_BLOCKED:blocked");
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("SSRF_BLOCKED")) {
      throw err;
    }
    // DNS failure → fail closed for user-supplied URLs
    throw new Error("SSRF_BLOCKED:invalid");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(checked.url.toString(), {
      ...rest,
      redirect: "error",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}
