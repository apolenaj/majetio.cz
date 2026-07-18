/**
 * Safe return URL after login — blocks open redirects.
 */
export function getSafeCallbackUrl(
  raw: string | string[] | undefined | null,
  fallback = "/ucet",
): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  if (value.includes("\\")) return fallback;
  // Block protocol-relative tricks and path traversal to other hosts
  if (value.includes("@")) return fallback;
  return value;
}

export function buildLoginUrl(callbackUrl?: string): string {
  const safe = callbackUrl ? getSafeCallbackUrl(callbackUrl) : "/ucet";
  return `/prihlaseni?callbackUrl=${encodeURIComponent(safe)}`;
}
