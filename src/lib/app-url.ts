/**
 * Public app URL — never emit localhost in production-like environments.
 */

import { SEO_HOSTS } from "@/domains/seo/architecture";

function isProdLike(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  );
}

function isLocalhostUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "[::1]"
    );
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/**
 * Canonical public origin (no trailing slash).
 * Production-like: refuses localhost; falls back to SEO host map.
 */
export function getPublicAppUrl(): string {
  const raw =
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.APP_URL ??
    "";

  if (raw.trim()) {
    const cleaned = raw.replace(/\/$/, "");
    if (isProdLike() && isLocalhostUrl(cleaned)) {
      return SEO_HOSTS.cz.origin;
    }
    return cleaned;
  }

  if (isProdLike()) {
    return SEO_HOSTS.cz.origin;
  }
  return "http://localhost:3000";
}

export function assertPublicAppUrlForPayments(): string {
  const url = getPublicAppUrl();
  if (isProdLike() && isLocalhostUrl(url)) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be a public HTTPS origin in production (not localhost).",
    );
  }
  return url;
}
