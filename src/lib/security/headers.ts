/**
 * Security response headers + CSP with per-request nonce.
 * Applied from middleware on every matched response.
 */

export function createRequestNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export type SecurityHeaderOptions = {
  nonce: string;
  /** Enforce CSP (true) vs Report-Only (false). Default enforce in production. */
  enforceCsp?: boolean;
  isProduction?: boolean;
};

/**
 * CSP: default-src self; scripts require nonce; no unsafe-eval.
 * frame-ancestors 'none' (clickjacking). Upgrade insecure in prod.
 */
export function buildContentSecurityPolicy(nonce: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-src https://www.google.com https://maps.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
  ];
  if (process.env.NODE_ENV === "production") {
    directives.push("upgrade-insecure-requests");
  }
  return directives.join("; ");
}

export function applySecurityHeaders(
  headers: Headers,
  opts: SecurityHeaderOptions,
): void {
  const isProduction =
    opts.isProduction ?? process.env.NODE_ENV === "production";
  const enforceCsp = opts.enforceCsp ?? isProduction;
  const csp = buildContentSecurityPolicy(opts.nonce);

  if (enforceCsp) {
    headers.set("Content-Security-Policy", csp);
  } else {
    headers.set("Content-Security-Policy-Report-Only", csp);
  }

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("X-DNS-Prefetch-Control", "off");

  if (isProduction) {
    headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  // Echo nonce for App Router (layout / Script)
  headers.set("x-nonce", opts.nonce);
}
