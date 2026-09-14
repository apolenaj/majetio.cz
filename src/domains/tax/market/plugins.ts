/**
 * Market tax calculation plugins (Prompt 17.4).
 * Local tax math must be market-specific or explicitly unavailable.
 */

export type MarketTaxPluginContext = {
  marketCode: string;
  baseCurrency: string;
  /** Annual NOI in major units (orientational). */
  annualNoiMajor: number | null;
  annualCashFlowMajor: number | null;
  purchasePriceMajor: number | null;
};

export type MarketTaxPluginResult = {
  status: "estimated" | "not_available" | "not_applied";
  pluginId: string;
  version: string;
  messageEn: string;
  /** After-tax CF when estimated; otherwise null. */
  afterTaxCashFlowMajor: number | null;
  /** Effective tax rate estimate in bps when known. */
  effectiveTaxBps: number | null;
};

export interface MarketTaxPlugin {
  readonly marketCode: string;
  readonly id: string;
  readonly version: string;
  readonly available: boolean;
  estimate(ctx: MarketTaxPluginContext): MarketTaxPluginResult;
}

export const czTaxPluginLimited: MarketTaxPlugin = {
  marketCode: "CZ",
  id: "cz_tax_limited_v1",
  version: "1.0.0",
  available: true,
  estimate(ctx) {
    if (ctx.annualCashFlowMajor == null) {
      return {
        status: "not_applied",
        pluginId: this.id,
        version: this.version,
        messageEn: "Insufficient inputs for CZ tax estimate.",
        afterTaxCashFlowMajor: null,
        effectiveTaxBps: null,
      };
    }
    // Orientational personal-income-style haircut — NOT tax advice.
    const effectiveTaxBps = 1500;
    const tax = (ctx.annualCashFlowMajor * effectiveTaxBps) / 10_000;
    return {
      status: "estimated",
      pluginId: this.id,
      version: this.version,
      messageEn:
        "Orientational CZ tax haircut only — not tax advice; verify with an adviser.",
      afterTaxCashFlowMajor: ctx.annualCashFlowMajor - tax,
      effectiveTaxBps,
    };
  },
};

export const unavailableTaxPlugin = (marketCode: string): MarketTaxPlugin => ({
  marketCode,
  id: `${marketCode.toLowerCase()}_tax_unavailable`,
  version: "1.0.0",
  available: false,
  estimate() {
    return {
      status: "not_available",
      pluginId: `${marketCode.toLowerCase()}_tax_unavailable`,
      version: "1.0.0",
      messageEn: `Local tax calculation unavailable for market ${marketCode}.`,
      afterTaxCashFlowMajor: null,
      effectiveTaxBps: null,
    };
  },
});

const TAX_PLUGINS: Record<string, MarketTaxPlugin> = {
  CZ: czTaxPluginLimited,
  AE: unavailableTaxPlugin("AE"),
  SK: unavailableTaxPlugin("SK"),
};

export function getMarketTaxPlugin(marketCode: string): MarketTaxPlugin {
  const code = marketCode.toUpperCase();
  return TAX_PLUGINS[code] ?? unavailableTaxPlugin(code);
}

export function estimateMarketTax(
  ctx: MarketTaxPluginContext,
): MarketTaxPluginResult {
  return getMarketTaxPlugin(ctx.marketCode).estimate(ctx);
}
