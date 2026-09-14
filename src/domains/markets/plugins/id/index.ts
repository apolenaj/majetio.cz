/**
 * ID — Indonesia.
 * Bali is a **region** under ID (regionCode: bali), never a separate market/country.
 */

import type { MarketPlugin } from "@/domains/markets/plugins/types";
import type { MarketRegionDefinition } from "@/domains/markets/types";

export const ID_BALI_REGION: MarketRegionDefinition = {
  regionCode: "bali",
  displayNameEn: "Bali",
  displayNameLocal: "Bali",
  parentMarketCode: "ID",
  timezone: "Asia/Makassar",
  defaultLocale: "en-ID",
  notesEn:
    "Tourism / villa inventory focus. Leasehold vs freehold nuances stay under ID regulatory pack — not a sovereign market.",
};

export const idMarketPlugin: MarketPlugin = {
  marketCode: "ID",
  definition: {
    marketCode: "ID",
    countryCode: "ID",
    displayNameEn: "Indonesia",
    displayNameLocal: "Indonesia",
    defaultLocale: "id-ID",
    supportedLocales: ["id-ID", "en-ID", "en-GB"],
    defaultCurrency: "IDR",
    timezone: "Asia/Jakarta",
    measurementSystem: "METRIC",
    enabled: false,
    launchStatus: "RESEARCH",
    regulatoryConfigVersion: "id-reg.research",
    hasMinimumPublicData: false,
    regions: [ID_BALI_REGION],
    notesEn: "National market; Bali is regionCode=bali under ID.",
  },
  property: {
    areaUnit: "sqm",
    supportedPropertyTypes: ["APARTMENT", "HOUSE", "VILLA", "LAND", "OTHER"],
    addressModel: "SEA_ISLAND",
    titleDeedLabelEn: "SHM / HGB / leasehold title",
    layoutNotation: "BEDROOM_COUNT",
    detailSectionExtraIds: ["off_plan"],
    searchFilterExtraKeys: ["bedrooms", "bathrooms", "offPlan"],
  },
  transactionCosts: {
    packId: "id-tx-costs.research",
    buyerClosingCostBpsEstimate: 700,
    sellerClosingCostBpsEstimate: 300,
    transferTaxLabelEn: "BPHTB / related fees (illustrative)",
    notesEn: "Foreign ownership restrictions — pack required.",
  },
  financing: {
    mortgageAvailable: true,
    partnerHandoffEnabled: false,
    typicalLtvMaxPct: 70,
    rateBenchmarkLabelEn: null,
    currency: "IDR",
    primaryProviderCode: null,
  },
  taxation: {
    standardVatRateBp: 1100,
    propertyTaxModel: "MIXED",
    rentalIncomeTaxNotesEn: "Pending ID regulatory pack (incl. Bali leaseholds).",
    regulatoryPackId: "id-tax.research",
    taxPluginId: null,
  },
  regulatory: {
    rulesVersion: "id-reg.research",
    renovationCatalogAvailable: false,
    valuationModelCodes: [],
  },
  capabilities: {
    PROPERTY_SEARCH: "NOT_AVAILABLE",
    VALUATION: "NOT_AVAILABLE",
    INVESTMENT_ENGINE: "NOT_AVAILABLE",
    MORTGAGE_CALCULATOR: "NOT_AVAILABLE",
    MORTGAGE_LEAD_HANDOFF: "NOT_AVAILABLE",
    COMPARISON: "NOT_AVAILABLE",
    LOCATION_INTELLIGENCE: "NOT_AVAILABLE",
    LISTING_BOOST: "NOT_AVAILABLE",
    B2B_CRM: "NOT_AVAILABLE",
    QUALIFIED_LEADS: "NOT_AVAILABLE",
    TAX_ESTIMATES: "NOT_AVAILABLE",
    TRANSACTION_COST_ESTIMATES: "MANUAL_ONLY",
    PROFESSIONAL_SERVICES: "NOT_AVAILABLE",
  },
  featureFlagDefaults: {
    MARKET_ID_VALUATION_ENABLED: false,
    MARKET_ID_BALI_FOCUS_ENABLED: false,
  },
  regions: [ID_BALI_REGION],
};
