/**
 * Safe notification / alert hrefs — no open redirects (BOD 136).
 * Only relative same-origin paths are allowed.
 */

const BLOCKED_SCHEMES = /^(https?:|\/\/|javascript:|data:|mailto:)/i;

/**
 * Sanitize a CTA href for in-app / email notifications.
 * Returns null when unsafe (absolute URL, protocol-relative, javascript:, …).
 */
export function sanitizeNotificationHref(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const href = String(raw).trim();
  if (!href) return null;
  if (BLOCKED_SCHEMES.test(href)) return null;
  if (!href.startsWith("/")) return null;
  // Reject path-relative trickery like /\evil.com or /%2f%2fevil
  if (href.startsWith("//") || href.includes("\\")) return null;
  if (/[\s<>"']/.test(href)) return null;
  // Cap length
  if (href.length > 500) return null;
  return href;
}

/** Absolute URL for e-mail CTA — only when base is our app origin. */
export function buildAppAbsoluteUrl(
  path: string | null | undefined,
  siteOrigin: string,
): string | null {
  const safe = sanitizeNotificationHref(path);
  if (!safe) return null;
  const origin = siteOrigin.replace(/\/$/, "");
  if (!/^https:\/\//i.test(origin) && process.env.NODE_ENV === "production") {
    return null;
  }
  return `${origin}${safe}`;
}
