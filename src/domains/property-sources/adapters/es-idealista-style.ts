/**
 * Spain Idealista-style import adapter → canonical Property + SpainPropertyAttributes.
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

type EsVendorPayload = {
  id?: string;
  externalId?: string;
  title?: string;
  description?: string;
  price?: number | string;
  currency?: string;
  size?: number | string;
  rooms?: number | string;
  bathrooms?: number | string;
  propertyType?: string;
  energyCertification?: string;
  orientation?: string;
  cadastralReference?: string;
  communityFees?: number | string;
  ibi?: number | string;
  floor?: number | string;
  hasLift?: boolean;
  terrace?: boolean;
  municipality?: string;
  district?: string;
  photos?: string[];
  url?: string;
};

function mapEnergy(raw?: string): string {
  const v = raw?.trim().toUpperCase() ?? "";
  if (/^[A-G]$/.test(v)) return v;
  if (v.includes("PROCESS")) return "IN_PROCESS";
  if (v.includes("EXEMPT")) return "EXEMPT";
  return "UNKNOWN";
}

function mapOrientation(raw?: string): string {
  const v = raw?.trim().toUpperCase().replace(/\s+/g, "") ?? "";
  const allowed = [
    "NORTH",
    "SOUTH",
    "EAST",
    "WEST",
    "NORTHEAST",
    "NORTHWEST",
    "SOUTHEAST",
    "SOUTHWEST",
  ];
  return allowed.includes(v) ? v : "UNKNOWN";
}

export class EsIdealistaStylePropertySourceAdapter
  implements PropertySourceAdapter
{
  readonly id = "es-idealista-style";
  readonly provider: string;

  constructor(provider = "idealista") {
    this.provider = provider;
  }

  parse(payload: unknown): AdapterParseResult {
    const raw = (
      typeof payload === "string" ? JSON.parse(payload) : payload
    ) as EsVendorPayload;
    return { raw, externalPropertyId: raw.id ?? raw.externalId };
  }

  validate(parsed: AdapterParseResult): AdapterValidateResult {
    const raw = parsed.raw as EsVendorPayload;
    const issues: AdapterValidateResult["issues"] = [];
    if (!parsed.externalPropertyId) {
      issues.push({
        path: "id",
        message: "Missing external id.",
        severity: "error",
      });
    }
    if (!raw.title?.trim()) {
      issues.push({
        path: "title",
        message: "Missing title.",
        severity: "error",
      });
    }
    return { ok: issues.every((i) => i.severity !== "error"), issues };
  }

  normalize(
    parsed: AdapterParseResult,
    ctx?: PropertySourceAdapterContext,
  ): Partial<NormalizedListing> {
    const raw = parsed.raw as EsVendorPayload;
    const size = coerceNumber(raw.size);
    const rooms = coerceNumber(raw.rooms);
    const baths = coerceNumber(raw.bathrooms);

    const marketExtensions = parseMarketExtensions("ES", {
      marketCode: "ES",
      energyCertificate: mapEnergy(raw.energyCertification),
      orientation: mapOrientation(raw.orientation),
      cadastralReference: raw.cadastralReference?.match(/^[A-Za-z0-9]{14,20}$/)
        ? raw.cadastralReference
        : undefined,
      communityFeesMonthlyEur: coerceNumber(raw.communityFees) ?? undefined,
      ibiAnnualEur: coerceNumber(raw.ibi) ?? undefined,
      floorNumber: coerceNumber(raw.floor) ?? undefined,
      hasElevator: raw.hasLift,
      hasTerrace: raw.terrace,
    });

    const localizedTexts = [
      createLocalizedPropertyText({
        field: "title",
        originalLocale: "es-ES",
        originalText: raw.title ?? "",
        translationSource: "ORIGINAL",
        machineGenerated: false,
      }),
    ];

    return {
      provider: ctx?.provider ?? this.provider,
      sourceType: ctx?.sourceType ?? "PORTAL",
      marketCode: "ES",
      countryCode: "ES",
      title: raw.title?.trim() ?? "",
      description: raw.description,
      askingPrice: coerceNumber(raw.price),
      currency: normalizeCurrency(raw.currency ?? "EUR"),
      usableAreaM2: size != null ? toCanonicalSqm(size, "sqm") : null,
      bedrooms: rooms,
      bathrooms: baths,
      layout:
        rooms != null
          ? formatLayoutForMarket({
              layout: {
                bedrooms: rooms,
                bathrooms: baths,
                additionalRooms: null,
                kitchenKind: null,
                isStudio: rooms === 0,
              },
              notationSystem: "BEDROOM_COUNT",
              locale: "es-ES",
              bathrooms: baths,
            }).label
          : undefined,
      propertyType: raw.propertyType,
      publicCity: raw.municipality,
      publicDistrict: raw.district,
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
      marketCode: "ES",
      raw: normalized.propertyType ?? "piso",
    });
    return {
      provider: normalized.provider ?? ctx?.provider ?? this.provider,
      sourceType: normalized.sourceType ?? ctx?.sourceType ?? "PORTAL",
      externalPropertyId: parsed.externalPropertyId!,
      marketCode: "ES",
      countryCode: "ES",
      title: normalized.title ?? "",
      description: normalized.description,
      propertyType: type ?? normalized.propertyType,
      transactionType: "SALE",
      askingPrice: normalized.askingPrice ?? null,
      currency: normalized.currency ?? "EUR",
      usableAreaM2: normalized.usableAreaM2 ?? null,
      floorAreaM2: null,
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
    const raw = parsed.raw as EsVendorPayload;
    return (raw.photos ?? []).map((url, i) => ({
      url,
      type: "PHOTO" as const,
      sortOrder: i,
      isPrimary: i === 0,
    }));
  }
}
