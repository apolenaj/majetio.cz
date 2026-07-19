/**
 * Safe media projection for public/detail DTO (Prompt 9 Part 1).
 * Never expose prohibited URLs or license internals beyond displayability.
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

export function canDisplayMediaUrl(
  licenseStatus: MediaLicenseStatus | null | undefined,
): boolean {
  const status = (licenseStatus ?? "UNKNOWN").toUpperCase();
  return status !== "PROHIBITED" && status !== "RESTRICTED";
}

export function toPublicMediaItem(item: InternalMediaItem): PublicMediaItem {
  const allowed = canDisplayMediaUrl(item.licenseStatus);
  if (!allowed) {
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
