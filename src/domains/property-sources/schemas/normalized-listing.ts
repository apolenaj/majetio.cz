/**
 * Intermediate listing shape produced by adapters before canonical upsert.
 * Not a public DTO — may contain precise address / raw source fields.
 */

import type { LocalizedPropertyText } from "@/domains/properties/extensions/text/localized-text";

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
  /** Explicit market — never inferred from currency alone. */
  marketCode?: string;
  countryCode?: string;
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
  bedrooms?: number | null;
  bathrooms?: number | null;
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
  /**
   * Typed market extension bag (validated later via parseMarketExtensions).
   * Prefer enums — never dump free-text local attributes here.
   */
  marketExtensions?: Record<string, unknown> | null;
  /** Original + translated strings with machine_generated provenance. */
  localizedTexts?: LocalizedPropertyText[];
  /** Opaque extras for provenance only — not market typed fields. */
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
