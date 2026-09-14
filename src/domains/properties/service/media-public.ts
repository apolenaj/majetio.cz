/**
 * Safe media projection for public/detail DTO (Prompt 9 Part 1).
 * Never expose prohibited URLs, private buckets, or license internals.
 */

export type MediaLicenseStatus =
  | "UNKNOWN"
  | "OWNED"
  | "LICENSED"
  | "PUBLIC_DOMAIN"
  | "RESTRICTED"
  | "PROHIBITED"
  | string;

export type InternalMediaItem = {
  url: string;
  type: string;
  isPrimary: boolean;
  isPlaceholder: boolean;
  alt?: string | null;
  licenseStatus?: MediaLicenseStatus | null;
  /** Internal — never map to public DTO. */
  sourceId?: string | null;
};

export type PublicMediaItem = {
  /** Empty when restricted — UI shows placeholder. */
  url: string | null;
  type: string;
  isPrimary: boolean;
  isPlaceholder: boolean;
  alt: string | null;
  /** True when license forbids showing the real image. */
  restricted: boolean;
};

/** Private / signed storage must never leak onto public cards or CDN OG tags. */
const PRIVATE_URL_HINTS = [
  /[?&](X-Amz-|Signature=|sig=|token=)/i,
  /localhost|127\.0\.0\.1|10\.\d+\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\./i,
  /\/(private|internal|secure)\//i,
  /\.s3[.-].*amazonaws\.com\/.*(private|internal)/i,
  /storage\.googleapis\.com\/.*(private|internal)/i,
];

export function isPubliclySafeMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (parsed.username || parsed.password) return false;
  return !PRIVATE_URL_HINTS.some((re) => re.test(url));
}

export function canDisplayMediaUrl(
  licenseStatus: MediaLicenseStatus | null | undefined,
): boolean {
  const status = (licenseStatus ?? "UNKNOWN").toUpperCase();
  return status !== "PROHIBITED" && status !== "RESTRICTED";
}

export function toPublicMediaItem(item: InternalMediaItem): PublicMediaItem {
  const licenseOk = canDisplayMediaUrl(item.licenseStatus);
  const urlSafe = isPubliclySafeMediaUrl(item.url);
  if (!licenseOk || !urlSafe) {
    return {
      url: null,
      type: item.type,
      isPrimary: item.isPrimary,
      isPlaceholder: true,
      alt: item.alt ?? "Fotografie není k dispozici (licence)",
      restricted: true,
    };
  }
  return {
    url: item.url || null,
    type: item.type,
    isPrimary: item.isPrimary,
    isPlaceholder: item.isPlaceholder || !item.url,
    alt: item.alt ?? null,
    restricted: false,
  };
}

export function toPublicMediaList(
  items: InternalMediaItem[] | null | undefined,
): PublicMediaItem[] {
  return (items ?? []).map(toPublicMediaItem);
}
