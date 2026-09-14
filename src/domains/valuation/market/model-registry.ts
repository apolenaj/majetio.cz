/**
 * Market-aware ValuationModelRegistry resolution (Prompt 17.4).
 * Never value a Dubai villa with the Czech apartment model.
 */

export type MarketValuationModelDef = {
  /** Registry code, e.g. CZ_APARTMENT_V1 */
  code: string;
  marketCode: string;
  displayNameEn: string;
  algorithmVersion: string;
  supportedPropertyTypes: readonly string[];
  /** When false, automated valuation must be disabled. */
  automatedEnabled: boolean;
  /** Legacy alias kept for existing CZ rows. */
  legacyCode?: string;
  disabledReasonEn?: string;
};

export const MARKET_VALUATION_MODELS: readonly MarketValuationModelDef[] = [
  {
    code: "CZ_APARTMENT_V1",
    marketCode: "CZ",
    displayNameEn: "Czech apartment automated estimate v1",
    algorithmVersion: "1.0.0",
    supportedPropertyTypes: ["APARTMENT", "STUDIO"],
    automatedEnabled: true,
    legacyCode: "residential_apartment_v1",
  },
  {
    code: "CZ_HOUSE_V1",
    marketCode: "CZ",
    displayNameEn: "Czech house automated estimate v1",
    algorithmVersion: "0.1.0",
    supportedPropertyTypes: ["HOUSE", "VILLA", "TOWNHOUSE"],
    automatedEnabled: false,
    disabledReasonEn: "House model not yet calibrated — automated valuation disabled.",
  },
  {
    code: "AE_APARTMENT_V1",
    marketCode: "AE",
    displayNameEn: "UAE apartment automated estimate v1",
    algorithmVersion: "0.1.0",
    supportedPropertyTypes: ["APARTMENT", "STUDIO"],
    automatedEnabled: false,
    disabledReasonEn:
      "Automated valuation disabled — insufficient AE comps / model not live.",
  },
  {
    code: "AE_VILLA_V1",
    marketCode: "AE",
    displayNameEn: "UAE villa automated estimate v1",
    algorithmVersion: "0.1.0",
    supportedPropertyTypes: ["VILLA", "TOWNHOUSE", "HOUSE"],
    automatedEnabled: false,
    disabledReasonEn:
      "Automated valuation disabled — never use CZ apartment model for AE villas.",
  },
] as const;

export const AUTOMATED_VALUATION_DISABLED_MESSAGE_EN =
  "Automated valuation disabled";

export type ValuationModelResolution =
  | {
      status: "READY";
      model: MarketValuationModelDef;
      /** Code to persist / look up in Prisma registry. */
      registryCode: string;
    }
  | {
      status: "DISABLED";
      model: MarketValuationModelDef | null;
      message: string;
      reason: string;
    };

/**
 * Resolve valuation model for market + property type.
 * Cross-market fallback is intentionally forbidden.
 */
export function resolveValuationModelForMarket(input: {
  marketCode: string;
  propertyType: string;
}): ValuationModelResolution {
  const market = input.marketCode.toUpperCase();
  const type = input.propertyType.toUpperCase();

  const candidates = MARKET_VALUATION_MODELS.filter(
    (m) => m.marketCode === market,
  );
  const match =
    candidates.find((m) =>
      m.supportedPropertyTypes.map((t) => t.toUpperCase()).includes(type),
    ) ?? null;

  if (!match) {
    return {
      status: "DISABLED",
      model: null,
      message: AUTOMATED_VALUATION_DISABLED_MESSAGE_EN,
      reason: `No valuation model registered for ${market} / ${type}.`,
    };
  }

  if (!match.automatedEnabled) {
    return {
      status: "DISABLED",
      model: match,
      message: AUTOMATED_VALUATION_DISABLED_MESSAGE_EN,
      reason: match.disabledReasonEn ?? "Model inactive.",
    };
  }

  return {
    status: "READY",
    model: match,
    registryCode: match.legacyCode ?? match.code,
  };
}

/** Guard: refuse using a model whose marketCode ≠ property market. */
export function assertValuationModelMarketMatch(input: {
  modelMarketCode: string;
  propertyMarketCode: string;
}): void {
  if (
    input.modelMarketCode.toUpperCase() !==
    input.propertyMarketCode.toUpperCase()
  ) {
    throw new Error(
      `Valuation model market ${input.modelMarketCode} does not match property market ${input.propertyMarketCode}`,
    );
  }
}
