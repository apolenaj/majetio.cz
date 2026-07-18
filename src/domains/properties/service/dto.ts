/**
 * Public property DTOs (Prompt 7 Part 4).
 * Strip internal notes, audit, and precise address for private / restricted listings.
 */

export type AddressPrecision = "EXACT" | "APPROXIMATE" | "CITY" | "HIDDEN" | string;
export type PropertyVisibility = "PUBLIC" | "PRIVATE" | "ACCOUNT_ONLY" | string;

/** Internal row shape — may include precise address & admin fields. */
export type PropertyRecord = {
  id: string;
  slug: string;
  status: string;
  visibility: PropertyVisibility;
  transactionType: string;
  title: string;
  description?: string | null;
  propertyType: string;
  askingPrice?: number | null;
  priceCzk?: number | null;
  currency: string;
  pricePerSqm?: number | null;
  usableArea?: number | null;
  floorArea?: number | null;
  areaSqm?: number | null;
  layout?: string | null;
  disposition?: string | null;
  publicLabel?: string | null;
  addressPrecision: AddressPrecision;
  publicCity?: string | null;
  publicDistrict?: string | null;
  publicRegion?: string | null;
  street?: string | null;
  houseNumber?: string | null;
  orientationNumber?: string | null;
  zip?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  /** Internal — never expose publicly. */
  internalNotes?: string | null;
  auditMeta?: unknown;
  canonicalKey?: string | null;
  media?: Array<{
    url: string;
    type: string;
    isPrimary: boolean;
    isPlaceholder: boolean;
    alt?: string | null;
  }>;
};

export type PublicPropertyLocation = {
  label: string | null;
  precision: AddressPrecision;
  city: string | null;
  district: string | null;
  region: string | null;
  /** Only when precision allows and visibility is public. */
  latitude: number | null;
  longitude: number | null;
};

export type PublicPropertyDto = {
  id: string;
  slug: string;
  status: string;
  visibility: PropertyVisibility;
  transactionType: string;
  title: string;
  description: string | null;
  propertyType: string;
  askingPrice: number | null;
  currency: string;
  pricePerSqm: number | null;
  usableArea: number | null;
  layout: string | null;
  location: PublicPropertyLocation;
  media: Array<{
    url: string;
    type: string;
    isPrimary: boolean;
    isPlaceholder: boolean;
    alt: string | null;
  }>;
  publishedAt: string | null;
  updatedAt: string | null;
};

export type PublicPropertyListItemDto = Pick<
  PublicPropertyDto,
  | "id"
  | "slug"
  | "title"
  | "askingPrice"
  | "currency"
  | "pricePerSqm"
  | "usableArea"
  | "layout"
  | "propertyType"
  | "transactionType"
  | "location"
  | "media"
  | "publishedAt"
>;

export type ToPublicDtoOptions = {
  /** Staff / owner may see more location detail. */
  viewerRole?: "PUBLIC" | "OWNER" | "STAFF";
};

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

function canExposeExactAddress(
  record: PropertyRecord,
  viewerRole: ToPublicDtoOptions["viewerRole"],
): boolean {
  if (viewerRole === "STAFF" || viewerRole === "OWNER") return true;
  if (record.visibility !== "PUBLIC") return false;
  return record.addressPrecision === "EXACT";
}

function canExposeCoordinates(
  record: PropertyRecord,
  viewerRole: ToPublicDtoOptions["viewerRole"],
): boolean {
  if (viewerRole === "STAFF" || viewerRole === "OWNER") return true;
  if (record.visibility !== "PUBLIC") return false;
  return (
    record.addressPrecision === "EXACT" || record.addressPrecision === "APPROXIMATE"
  );
}

function publicLocation(
  record: PropertyRecord,
  opts: ToPublicDtoOptions,
): PublicPropertyLocation {
  const role = opts.viewerRole ?? "PUBLIC";
  const exact = canExposeExactAddress(record, role);
  const coords = canExposeCoordinates(record, role);

  if (record.visibility === "PRIVATE" && role === "PUBLIC") {
    return {
      label: record.publicCity ? `${record.publicCity} a okolí` : null,
      precision: "CITY",
      city: record.publicCity ?? null,
      district: null,
      region: record.publicRegion ?? null,
      latitude: null,
      longitude: null,
    };
  }

  return {
    label: record.publicLabel ?? null,
    precision: exact ? record.addressPrecision : record.addressPrecision === "EXACT" ? "APPROXIMATE" : record.addressPrecision,
    city: record.publicCity ?? null,
    district: record.publicDistrict ?? null,
    region: record.publicRegion ?? null,
    latitude: coords ? (record.latitude ?? null) : null,
    longitude: coords ? (record.longitude ?? null) : null,
  };
}

/**
 * Map DB/internal record → public DTO (filters street, house no., notes, audit, canonicalKey).
 */
export function toPublicPropertyDto(
  record: PropertyRecord,
  opts: ToPublicDtoOptions = {},
): PublicPropertyDto {
  const role = opts.viewerRole ?? "PUBLIC";
  const media = (record.media ?? []).map((m) => ({
    url: m.url,
    type: m.type,
    isPrimary: m.isPrimary,
    isPlaceholder: m.isPlaceholder,
    alt: m.alt ?? null,
  }));

  return {
    id: record.id,
    slug: record.slug,
    status: record.status,
    visibility: record.visibility,
    transactionType: record.transactionType,
    title: record.title,
    description: record.description ?? null,
    propertyType: record.propertyType,
    askingPrice: record.askingPrice ?? record.priceCzk ?? null,
    currency: record.currency,
    pricePerSqm: record.pricePerSqm ?? null,
    usableArea: record.usableArea ?? record.areaSqm ?? null,
    layout: record.layout ?? record.disposition ?? null,
    location: publicLocation(record, { viewerRole: role }),
    media,
    publishedAt: iso(record.publishedAt),
    updatedAt: iso(record.updatedAt),
  };
}

export function toPublicPropertyListItemDto(
  record: PropertyRecord,
  opts: ToPublicDtoOptions = {},
): PublicPropertyListItemDto {
  const full = toPublicPropertyDto(record, opts);
  return {
    id: full.id,
    slug: full.slug,
    title: full.title,
    askingPrice: full.askingPrice,
    currency: full.currency,
    pricePerSqm: full.pricePerSqm,
    usableArea: full.usableArea,
    layout: full.layout,
    propertyType: full.propertyType,
    transactionType: full.transactionType,
    location: full.location,
    media: full.media.slice(0, 1),
    publishedAt: full.publishedAt,
  };
}
