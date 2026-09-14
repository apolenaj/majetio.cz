/**
 * Privacy-by-Default HTTP helpers — cache, CORS deny for webhooks.
 */

/** Paths that must never hit shared CDN / public caches. */
export const PRIVATE_NO_STORE_PREFIXES = [
  "/ucet",
  "/onboarding",
  "/admin",
  "/profi",
  "/checkout",
  "/api/admin",
  "/api/account",
  "/api/payments",
  "/api/integrations",
] as const;

export function isPrivateNoStorePath(pathname: string): boolean {
  return PRIVATE_NO_STORE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Strict private cache — blocks shared CDN caches. */
export const CACHE_CONTROL_PRIVATE_NO_STORE =
  "private, no-store, no-cache, max-age=0, must-revalidate" as const;

export function applyPrivateCacheHeaders(headers: Headers): void {
  headers.set("Cache-Control", CACHE_CONTROL_PRIVATE_NO_STORE);
  headers.set("Pragma", "no-cache");
  // Prevent intermediaries from storing personalized variants incorrectly
  headers.set("Vary", "Cookie, Authorization");
}

/**
 * Webhooks and signed callbacks must not expose broad CORS.
 * Explicitly omit ACAO; reject preflight with 405.
 */
export function rejectCorsPreflight(): Response {
  return new Response(null, {
    status: 405,
    headers: {
      Allow: "POST",
      "Cache-Control": CACHE_CONTROL_PRIVATE_NO_STORE,
    },
  });
}

/** Strip any Accidental CORS headers from webhook responses. */
export function stripCorsHeaders(headers: Headers): void {
  headers.delete("Access-Control-Allow-Origin");
  headers.delete("Access-Control-Allow-Credentials");
  headers.delete("Access-Control-Allow-Methods");
  headers.delete("Access-Control-Allow-Headers");
  headers.delete("Access-Control-Expose-Headers");
}

export function jsonNoStore(
  body: unknown,
  init?: { status?: number },
): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
  });
  applyPrivateCacheHeaders(headers);
  stripCorsHeaders(headers);
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers,
  });
}
