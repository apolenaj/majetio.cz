/**
 * SK — Slovakia. Research / near-term expansion (EUR, shared Slavic UX).
 */

import type { MarketPlugin } from "@/domains/markets/plugins/types";

export const skMarketPlugin: MarketPlugin = {
  marketCode: "SK",
  definition: {
    marketCode: "SK",
    countryCode: "SK",
    displayNameEn: "Slovakia",
    displayNameLocal: "Slovensko",
    defaultLocale: "sk-SK",
    supportedLocales: ["sk-SK", "cs-CZ", "en-GB"],
    defaultCurrency: "EUR",
    timezone: "Europe/Bratislava",
    measurementSystem: "METRIC",
    enabled: false,
    launchStatus: "RESEARCH",
    regulatoryConfigVersion: "sk-reg.draft",
    hasMinimumPublicData: false,
    notesEn: "Next EU market candidate — not public until data + pack.",
  },
  property: {
    areaUnit: "sqm",
    supportedPropertyTypes: ["APARTMENT", "HOUSE", "LAND", "OTHER"],
    addressModel: "EU_STREET",
    titleDeedLabelEn: "Kataster / title extract",
    layoutNotation: "CZ_DISPOSITION",
    detailSectionExtraIds: ["svj", "penb"],
    searchFilterExtraKeys: ["layout", "ownership", "condition", "energy"],
  },
  transactionCosts: {
    packId: "sk-tx-costs.draft",
    buyerClosingCostBpsEstimate: 400,
    sellerClosingCostBpsEstimate: 300,
    transferTaxLabelEn: "Transfer / notary (illustrative)",
    notesEn: "Draft estimates — RESEARCH.",
  },
  financing: {
    mortgageAvailable: true,
    partnerHandoffEnabled: false,
    typicalLtvMaxPct: 80,
    rateBenchmarkLabelEn: null,
    currency: "EUR",
    primaryProviderCode: null,
  },
  taxation: {
    standardVatRateBp: 2000,
    propertyTaxModel: "MIXED",
    rentalIncomeTaxNotesEn: "Pending SK regulatory pack.",
    regulatoryPackId: "sk-tax.draft",
    taxPluginId: null,
  },
  regulatory: {
    rulesVersion: "sk-reg.draft",
    renovationCatalogAvailable: false,
    valuationModelCodes: [],
  },
  capabilities: {
    PROPERTY_SEARCH: "NOT_AVAILABLE",
    VALUATION: "NOT_AVAILABLE",
    INVESTMENT_ENGINE: "LIMITED",
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
    MARKET_SK_VALUATION_ENABLED: false,
    MARKET_SK_INVESTMENT_ENGINE_ENABLED: false,
    MARKET_SK_MORTGAGE_ENABLED: false,
  },
};
