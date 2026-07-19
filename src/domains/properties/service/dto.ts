/**
 * Public property DTOs (Prompt 7 Parts 4–5).
 * Strip internal notes, audit, and precise address for private / restricted listings.
 */

export type DataQualityLevel =
  | "verified"
  | "estimated"
  | "pending"
  | "stale"
  | "incomplete"
  | "unavailable";

export type AddressPrecision = "EXACT" | "APPROXIMATE" | "CITY" | "HIDDEN" | string;
export type PropertyVisibility = "PUBLIC" | "PRIVATE" | "ACCOUNT_ONLY" | string;

export type PublicPriceHistoryPoint = {
  amount: number;
  currency: string;
  changeType: string;
  observedAt: string;
  sourceLabel?: string | null;
};

export type PublicSourceFreshness = {
  provider: string;
  sourceType?: string | null;
  lastSeenAt: string | null;
  lastFetchedAt: string | null;
  freshness: "FRESH" | "STALE" | "UNAVAILABLE" | string;
  isPrimary?: boolean;
};

export type PublicFieldConflict = {
  fieldKey: string;
  label: string;
  /** Human-readable range, e.g. "72–74 m² podle zdrojů". */
  display: string;
  values: Array<{ value: string; sourceLabel?: string }>;
};

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
  lastSeenAt?: Date | string | null;
  freshness?: string | null;
  isDemo?: boolean;
  ownerUserId?: string | null;
  dataQuality?: DataQualityLevel | null;
  tags?: string[];
  completenessScore?: number | null;
  grossYieldPct?: number | null;
  cashFlowMonthlyCzk?: number | null;
  majetioScore?: number | null;
  risk?: "low" | "medium" | "high" | "critical" | "unknown" | null;
  priceHistory?: PublicPriceHistoryPoint[];
  sources?: PublicSourceFreshness[];
  fieldConflicts?: PublicFieldConflict[];
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
  /** Prefer conflict display when sources disagree. */
  usableAreaDisplay: string | null;
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
  isDemo: boolean;
  dataQuality: DataQualityLevel | null;
  tags: string[];
  completenessScore: number | null;
  grossYieldPct: number | null;
  cashFlowMonthlyCzk: number | null;
  majetioScore: number | null;
  risk: PropertyRecord["risk"];
  priceHistory: PublicPriceHistoryPoint[];
  sources: PublicSourceFreshness[];
  fieldConflicts: PublicFieldConflict[];
  freshness: string | null;
  lastSeenAt: string | null;
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
  | "usableAreaDisplay"
  | "layout"
  | "propertyType"
  | "transactionType"
  | "location"
  | "media"
  | "publishedAt"
  | "isDemo"
  | "dataQuality"
  | "tags"
  | "grossYieldPct"
  | "cashFlowMonthlyCzk"
  | "majetioScore"
  | "risk"
>;

export type ToPublicDtoOptions = {
  viewerRole?: "PUBLIC" | "OWNER" | "STAFF";
  viewerUserId?: string | null;
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
    precision: exact
      ? record.addressPrecision
      : record.addressPrecision === "EXACT"
        ? "APPROXIMATE"
        : record.addressPrecision,
    city: record.publicCity ?? null,
    district: record.publicDistrict ?? null,
    region: record.publicRegion ?? null,
    latitude: coords ? (record.latitude ?? null) : null,
    longitude: coords ? (record.longitude ?? null) : null,
  };
}

function areaDisplay(record: PropertyRecord): string | null {
  const conflict = record.fieldConflicts?.find((c) => c.fieldKey === "usableArea");
  if (conflict) return conflict.display;
  const area = record.usableArea ?? record.areaSqm;
  return area != null ? `${area} m²` : null;
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
    usableAreaDisplay: areaDisplay(record),
    layout: record.layout ?? record.disposition ?? null,
    location: publicLocation(record, { viewerRole: role }),
    media,
    publishedAt: iso(record.publishedAt),
    updatedAt: iso(record.updatedAt),
    isDemo: record.isDemo === true,
    dataQuality: record.dataQuality ?? null,
    tags: record.tags ?? [],
    completenessScore: record.completenessScore ?? null,
    grossYieldPct: record.grossYieldPct ?? null,
    cashFlowMonthlyCzk: record.cashFlowMonthlyCzk ?? null,
    majetioScore: record.majetioScore ?? null,
    risk: record.risk ?? null,
    priceHistory: record.priceHistory ?? [],
    sources: record.sources ?? [],
    fieldConflicts: record.fieldConflicts ?? [],
    freshness: record.freshness ?? null,
    lastSeenAt: iso(record.lastSeenAt),
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
    usableAreaDisplay: full.usableAreaDisplay,
    layout: full.layout,
    propertyType: full.propertyType,
    transactionType: full.transactionType,
    location: full.location,
    media: full.media.slice(0, 1),
    publishedAt: full.publishedAt,
    isDemo: full.isDemo,
    dataQuality: full.dataQuality,
    tags: full.tags,
    grossYieldPct: full.grossYieldPct,
    cashFlowMonthlyCzk: full.cashFlowMonthlyCzk,
    majetioScore: full.majetioScore,
    risk: full.risk,
  };
}
