/**
 * MarketPlugin contract — market-specific behaviour without forking Core.
 * New market = new plugin folder + registry entry; no core rewrites.
 */

import type {
  CapabilityStatus,
  MarketCapabilityKey,
  MarketDefinition,
  MarketRegionDefinition,
} from "@/domains/markets/types";

export type PropertyMarketConfig = {
  /** Typical listing area unit label (canonical storage remains m²). */
  areaUnit: "sqm" | "sqft";
  /** Supported canonical property type codes. */
  supportedPropertyTypes: readonly string[];
  /** Address / cadastral nuances. */
  addressModel: "EU_STREET" | "GULF" | "SEA_ISLAND" | "GENERIC";
  titleDeedLabelEn: string;
  /**
   * Layout UI notation (Prompt 17.3).
   * Analytics always use bedrooms/bathrooms; this only drives display.
   */
  layoutNotation: "CZ_DISPOSITION" | "BEDROOM_COUNT" | "STUDIO_FLAG" | "GENERIC";
  /**
   * Extra property-detail section plugin ids (beyond core).
   * Resolved via section-plugins catalog — no country ifs in UI.
   */
  detailSectionExtraIds: readonly string[];
  /**
   * Extra search filter keys (beyond shared price/type/area/channel/query).
   */
  searchFilterExtraKeys: readonly string[];
};

export type TransactionCostConfig = {
  /**
   * Versioned pack id (Prompt 17.4) — source of truth for line-item estimates.
   * Prefer estimateTransactionCosts(pack) over flat bps.
   */
  packId: string;
  /** @deprecated Rough roll-up only — use versioned pack lines. */
  buyerClosingCostBpsEstimate: number;
  /** @deprecated Rough roll-up only — use versioned pack lines. */
  sellerClosingCostBpsEstimate: number;
  transferTaxLabelEn: string;
  notesEn: string;
};

export type FinancingMarketConfig = {
  mortgageAvailable: boolean;
  partnerHandoffEnabled: boolean;
  typicalLtvMaxPct: number | null;
  rateBenchmarkLabelEn: string | null;
  currency: string;
  /** FinancingProviderRegistry code when known (e.g. hypotekajasne). */
  primaryProviderCode: string | null;
};

export type TaxationMarketConfig = {
  standardVatRateBp: number | null;
  propertyTaxModel: "NONE" | "ANNUAL" | "TRANSFER_ONLY" | "MIXED" | "UNKNOWN";
  rentalIncomeTaxNotesEn: string;
  regulatoryPackId: string;
  /** Market tax plugin id — null when unavailable. */
  taxPluginId: string | null;
};

export type RegulatoryMarketConfig = {
  /** Seed regulatory pack version string. */
  rulesVersion: string;
  /** Renovation cost catalog available for this market. */
  renovationCatalogAvailable: boolean;
  /** Valuation model codes registered for this market. */
  valuationModelCodes: readonly string[];
};

export type MarketPlugin = {
  /** Must match MarketDefinition.marketCode. */
  marketCode: string;
  definition: MarketDefinition;
  property: PropertyMarketConfig;
  transactionCosts: TransactionCostConfig;
  financing: FinancingMarketConfig;
  taxation: TaxationMarketConfig;
  /** Prompt 17.4 — regulatory / valuation / renovation hooks. */
  regulatory: RegulatoryMarketConfig;
  /**
   * Capability overrides for this market.
   * Missing keys inherit NOT_AVAILABLE in the matrix builder.
   */
  capabilities: Partial<Record<MarketCapabilityKey, CapabilityStatus>>;
  /**
   * Env-overridable boolean flags (MARKET_{CODE}_{FEATURE}_ENABLED).
   * Defaults come from capability status (FULL/BETA → true).
   */
  featureFlagDefaults: Record<string, boolean>;
  regions?: readonly MarketRegionDefinition[];
};

export function emptyCapabilities(
  fill: CapabilityStatus = "NOT_AVAILABLE",
): Record<MarketCapabilityKey, CapabilityStatus> {
  return {
    PROPERTY_SEARCH: fill,
    VALUATION: fill,
    INVESTMENT_ENGINE: fill,
    MORTGAGE_CALCULATOR: fill,
    MORTGAGE_LEAD_HANDOFF: fill,
    COMPARISON: fill,
    LOCATION_INTELLIGENCE: fill,
    LISTING_BOOST: fill,
    B2B_CRM: fill,
    QUALIFIED_LEADS: fill,
    TAX_ESTIMATES: fill,
    TRANSACTION_COST_ESTIMATES: fill,
    PROFESSIONAL_SERVICES: fill,
  };
}
