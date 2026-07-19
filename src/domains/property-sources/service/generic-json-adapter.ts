/**
 * Reference JSON adapter for partner feeds / fixtures (Prompt 7 Part 4).
 */

import type {
  AdapterParseResult,
  AdapterValidateResult,
  NormalizedListing,
  NormalizedMediaItem,
} from "../schemas/normalized-listing";
import type { PropertySourceAdapter, PropertySourceAdapterContext } from "./adapter";
import {
  areaToSquareMeters,
  coerceNumber,
  normalizeCurrency,
} from "./normalize";

type JsonListingPayload = {
  id?: string;
  externalId?: string;
  title?: string;
  description?: string;
  price?: number | string;
  currency?: string;
  area?: number | string;
  areaUnit?: string;
  floorArea?: number | string;
  city?: string;
  district?: string;
  region?: string;
  street?: string;
  houseNumber?: string;
  lat?: number | string;
  lng?: number | string;
  url?: string;
  layout?: string;
  propertyType?: string;
  transactionType?: string;
  photos?: Array<string | { url: string; type?: string }>;
};

export class GenericJsonPropertySourceAdapter implements PropertySourceAdapter {
  readonly id = "generic-json";
  readonly provider: string;

  constructor(provider = "generic") {
    this.provider = provider;
  }

  parse(payload: unknown): AdapterParseResult {
    const raw = (typeof payload === "string" ? JSON.parse(payload) : payload) as JsonListingPayload;
    const externalPropertyId = raw.id ?? raw.externalId;
    return { raw, externalPropertyId };
  }

  validate(parsed: AdapterParseResult): AdapterValidateResult {
    const raw = parsed.raw as JsonListingPayload;
    const issues: AdapterValidateResult["issues"] = [];
    if (!parsed.externalPropertyId) {
      issues.push({
        path: "id",
        message: "Chybí external id (id / externalId).",
        severity: "error",
      });
    }
    if (!raw.title?.trim()) {
      issues.push({ path: "title", message: "Chybí title.", severity: "error" });
    }
    return { ok: issues.every((i) => i.severity !== "error"), issues };
  }

  normalize(
    parsed: AdapterParseResult,
    ctx?: PropertySourceAdapterContext,
  ): Partial<NormalizedListing> {
    const raw = parsed.raw as JsonListingPayload;
    const area = coerceNumber(raw.area);
    const floor = coerceNumber(raw.floorArea);
    const price = coerceNumber(raw.price);
    const lat = coerceNumber(raw.lat);
    const lng = coerceNumber(raw.lng);
    const tx = (raw.transactionType ?? "SALE").toUpperCase();

    return {
      provider: ctx?.provider ?? this.provider,
      sourceType: ctx?.sourceType ?? "PARTNER_FEED",
      externalPropertyId: String(parsed.externalPropertyId),
      sourceUrl: raw.url,
      title: raw.title?.trim() ?? "",
      description: raw.description,
      propertyType: raw.propertyType,
      transactionType: tx === "RENT" ? "RENT" : "SALE",
      askingPrice: price,
      currency: normalizeCurrency(raw.currency),
      usableAreaM2: area != null ? areaToSquareMeters(area, raw.areaUnit) : null,
      floorAreaM2: floor != null ? areaToSquareMeters(floor, raw.areaUnit) : null,
      layout: raw.layout,
      publicCity: raw.city,
      publicDistrict: raw.district,
      publicRegion: raw.region,
      street: raw.street,
      houseNumber: raw.houseNumber,
      latitude: lat,
      longitude: lng,
    };
  }

  map(
    normalized: Partial<NormalizedListing>,
    parsed: AdapterParseResult,
    ctx?: PropertySourceAdapterContext,
  ): NormalizedListing {
    const media = normalized.media ?? this.extractMedia(parsed);
    return {
      provider: normalized.provider ?? ctx?.provider ?? this.provider,
      sourceType: normalized.sourceType ?? ctx?.sourceType ?? "PARTNER_FEED",
      externalPropertyId: String(
        normalized.externalPropertyId ?? parsed.externalPropertyId,
      ),
      sourceUrl: normalized.sourceUrl,
      title: normalized.title ?? "",
      description: normalized.description,
      propertyType: normalized.propertyType,
      transactionType: normalized.transactionType ?? "SALE",
      askingPrice: normalized.askingPrice,
      currency: normalized.currency ?? "CZK",
      usableAreaM2: normalized.usableAreaM2,
      floorAreaM2: normalized.floorAreaM2,
      landAreaM2: normalized.landAreaM2,
      layout: normalized.layout,
      publicCity: normalized.publicCity,
      publicDistrict: normalized.publicDistrict,
      publicRegion: normalized.publicRegion,
      publicLabel: normalized.publicLabel,
      street: normalized.street,
      houseNumber: normalized.houseNumber,
      zip: normalized.zip,
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      media,
      attributes: normalized.attributes,
    };
  }

  extractMedia(parsed: AdapterParseResult): NormalizedMediaItem[] {
    const raw = parsed.raw as JsonListingPayload;
    if (!raw.photos?.length) return [];
    return raw.photos.map((photo, index) => {
      if (typeof photo === "string") {
        return { url: photo, type: "PHOTO" as const, sortOrder: index };
      }
      return {
        url: photo.url,
        type: (photo.type as NormalizedMediaItem["type"]) ?? "PHOTO",
        sortOrder: index,
      };
    });
  }
}
