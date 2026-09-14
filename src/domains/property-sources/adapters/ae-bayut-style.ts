/**
 * UAE listing import adapter (Bayut / Property Finder style research payload).
 * Maps vendor fields → canonical NormalizedListing + UAEPropertyAttributes.
 */

import { resolveCanonicalPropertyType } from "@/domains/properties/taxonomy/canonical-types";
import { formatLayoutForMarket } from "@/domains/properties/taxonomy/layout";
import { toCanonicalSqm } from "@/domains/properties/units/area";
import { parseMarketExtensions } from "@/domains/properties/extensions/registry";
import { createLocalizedPropertyText } from "@/domains/properties/extensions/text/localized-text";
import type {
  AdapterParseResult,
  AdapterValidateResult,
  NormalizedListing,
  NormalizedMediaItem,
} from "@/domains/property-sources/schemas/normalized-listing";
import type {
  PropertySourceAdapter,
  PropertySourceAdapterContext,
} from "@/domains/property-sources/service/adapter";
import { coerceNumber, normalizeCurrency } from "@/domains/property-sources/service/normalize";

type AeVendorPayload = {
  id?: string;
  externalId?: string;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  price?: number | string;
  currency?: string;
  size?: number | string;
  sizeUnit?: "sqft" | "sqm" | string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  propertyType?: string;
  furnishing?: string;
  view?: string;
  parking?: string | number;
  serviceCharge?: number | string;
  permitNumber?: string;
  rera?: string;
  city?: string;
  community?: string;
  photos?: string[];
  url?: string;
};

function mapFurnishing(raw?: string): string {
  const v = raw?.trim().toLowerCase() ?? "";
  if (v.includes("unfurn")) return "UNFURNISHED";
  if (v.includes("semi")) return "SEMI_FURNISHED";
  if (v.includes("furn")) return "FURNISHED";
  return "UNKNOWN";
}

function mapView(raw?: string): string {
  const v = raw?.trim().toLowerCase() ?? "";
  if (v.includes("sea")) return "SEA";
  if (v.includes("golf")) return "GOLF";
  if (v.includes("community")) return "COMMUNITY";
  if (v.includes("city")) return "CITY";
  if (v.includes("lagoon")) return "LAGOON";
  if (v.includes("park")) return "PARK";
  return "UNKNOWN";
}

export class AeBayutStylePropertySourceAdapter implements PropertySourceAdapter {
  readonly id = "ae-bayut-style";
  readonly provider: string;

  constructor(provider = "bayut") {
    this.provider = provider;
  }

  parse(payload: unknown): AdapterParseResult {
    const raw = (
      typeof payload === "string" ? JSON.parse(payload) : payload
    ) as AeVendorPayload;
    return {
      raw,
      externalPropertyId: raw.id ?? raw.externalId,
    };
  }

  validate(parsed: AdapterParseResult): AdapterValidateResult {
    const raw = parsed.raw as AeVendorPayload;
    const issues: AdapterValidateResult["issues"] = [];
    if (!parsed.externalPropertyId) {
      issues.push({
        path: "id",
        message: "Missing external id.",
        severity: "error",
      });
    }
    if (!raw.title?.trim() && !raw.titleAr?.trim()) {
      issues.push({
        path: "title",
        message: "Missing title (en or ar).",
        severity: "error",
      });
    }
    return { ok: issues.every((i) => i.severity !== "error"), issues };
  }

  normalize(
    parsed: AdapterParseResult,
    ctx?: PropertySourceAdapterContext,
  ): Partial<NormalizedListing> {
    const raw = parsed.raw as AeVendorPayload;
    const size = coerceNumber(raw.size);
    const unit =
      raw.sizeUnit?.toLowerCase() === "sqm" || raw.sizeUnit === "m2"
        ? "sqm"
        : "sqft";
    const usableAreaM2 =
      size != null ? toCanonicalSqm(size, unit) : null;
    const beds = coerceNumber(raw.bedrooms);
    const baths = coerceNumber(raw.bathrooms);

    const marketExtensions = parseMarketExtensions("AE", {
      marketCode: "AE",
      furnishing: mapFurnishing(raw.furnishing),
      viewType: mapView(raw.view),
      parkingSpaces:
        typeof raw.parking === "number"
          ? raw.parking
          : coerceNumber(raw.parking) ?? undefined,
      serviceChargeAedPerSqftYear: coerceNumber(raw.serviceCharge) ?? undefined,
      permitNumber: raw.permitNumber,
      reraNumber: raw.rera,
      communitySlug: raw.community
        ?.trim()
        .toLowerCase()
        .replace(/\s+/g, "-"),
    });

    const localizedTexts = [];
    if (raw.titleAr?.trim()) {
      localizedTexts.push(
        createLocalizedPropertyText({
          field: "title",
          originalLocale: "ar-AE",
          originalText: raw.titleAr,
          translationSource: "ORIGINAL",
          machineGenerated: false,
        }),
      );
    }
    if (raw.title?.trim()) {
      localizedTexts.push(
        createLocalizedPropertyText({
          field: "title",
          originalLocale: "en-AE",
          originalText: raw.title,
          translatedLocale: raw.titleAr ? "en-AE" : undefined,
          translationSource: "ORIGINAL",
          machineGenerated: false,
        }),
      );
    }
    if (raw.descriptionAr?.trim()) {
      localizedTexts.push(
        createLocalizedPropertyText({
          field: "description",
          originalLocale: "ar-AE",
          originalText: raw.descriptionAr,
          translationSource: "ORIGINAL",
          machineGenerated: false,
        }),
      );
    }

    return {
      provider: ctx?.provider ?? this.provider,
      sourceType: ctx?.sourceType ?? "PORTAL",
      marketCode: "AE",
      countryCode: "AE",
      title: raw.title?.trim() || raw.titleAr?.trim() || "",
      description: raw.description,
      askingPrice: coerceNumber(raw.price),
      currency: normalizeCurrency(raw.currency ?? "AED"),
      usableAreaM2,
      bedrooms: beds,
      bathrooms: baths,
      layout:
        beds != null
          ? formatLayoutForMarket({
              layout: {
                bedrooms: beds,
                bathrooms: baths,
                additionalRooms: null,
                kitchenKind: null,
                isStudio: beds === 0,
              },
              notationSystem: "BEDROOM_COUNT",
              locale: "en-AE",
              bathrooms: baths,
            }).label
          : undefined,
      propertyType: raw.propertyType,
      publicCity: raw.city,
      publicDistrict: raw.community,
      sourceUrl: raw.url,
      marketExtensions: marketExtensions ?? undefined,
      localizedTexts,
    };
  }

  map(
    normalized: Partial<NormalizedListing>,
    parsed: AdapterParseResult,
    ctx?: PropertySourceAdapterContext,
  ): NormalizedListing {
    const media = this.extractMedia(parsed, normalized);
    const type = resolveCanonicalPropertyType({
      marketCode: "AE",
      raw: normalized.propertyType ?? "apartment",
    });
    return {
      provider: normalized.provider ?? ctx?.provider ?? this.provider,
      sourceType: normalized.sourceType ?? ctx?.sourceType ?? "PORTAL",
      externalPropertyId: parsed.externalPropertyId!,
      marketCode: "AE",
      countryCode: "AE",
      title: normalized.title ?? "",
      description: normalized.description,
      propertyType: type ?? normalized.propertyType,
      transactionType: "SALE",
      askingPrice: normalized.askingPrice ?? null,
      currency: normalized.currency ?? "AED",
      usableAreaM2: normalized.usableAreaM2 ?? null,
      floorAreaM2: normalized.floorAreaM2 ?? null,
      landAreaM2: null,
      layout: normalized.layout,
      bedrooms: normalized.bedrooms,
      bathrooms: normalized.bathrooms,
      publicCity: normalized.publicCity,
      publicDistrict: normalized.publicDistrict,
      sourceUrl: normalized.sourceUrl,
      media,
      marketExtensions: normalized.marketExtensions,
      localizedTexts: normalized.localizedTexts,
    };
  }

  extractMedia(
    parsed: AdapterParseResult,
    _normalized?: Partial<NormalizedListing>,
  ): NormalizedMediaItem[] {
    const raw = parsed.raw as AeVendorPayload;
    return (raw.photos ?? []).map((url, i) => ({
      url,
      type: "PHOTO" as const,
      sortOrder: i,
      isPrimary: i === 0,
    }));
  }
}
