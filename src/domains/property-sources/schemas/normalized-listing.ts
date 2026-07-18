/**
 * Intermediate listing shape produced by adapters before canonical upsert.
 * Not a public DTO — may contain precise address / raw source fields.
 */

export type NormalizedAreaUnit = "m2" | "sqft" | "unknown";
export type NormalizedCurrency = string; // ISO 4217, e.g. CZK

export type NormalizedMediaItem = {
  url: string;
  type?: "PHOTO" | "FLOORPLAN" | "DOCUMENT" | "VIDEO" | "OTHER";
  sortOrder?: number;
  isPrimary?: boolean;
  alt?: string;
  licenseStatus?: string;
};

export type NormalizedListing = {
  provider: string;
  sourceType: string;
  externalPropertyId: string;
  sourceUrl?: string;
  title: string;
  description?: string;
  propertyType?: string;
  transactionType?: "SALE" | "RENT";
  askingPrice?: number | null;
  currency: NormalizedCurrency;
  usableAreaM2?: number | null;
  floorAreaM2?: number | null;
  landAreaM2?: number | null;
  layout?: string;
  publicCity?: string;
  publicDistrict?: string;
  publicRegion?: string;
  publicLabel?: string;
  street?: string;
  houseNumber?: string;
  zip?: string;
  latitude?: number | null;
  longitude?: number | null;
  media: NormalizedMediaItem[];
  /** Opaque extras for provenance / attributes. */
  attributes?: Record<string, unknown>;
};

export type AdapterValidationIssue = {
  path: string;
  message: string;
  severity: "error" | "warning";
};

export type AdapterParseResult = {
  raw: unknown;
  /** Stable id from source when present. */
  externalPropertyId?: string;
};

export type AdapterValidateResult = {
  ok: boolean;
  issues: AdapterValidationIssue[];
};
