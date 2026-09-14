/**
 * Entitlement marketScope — Buyer Pass CZ must not unlock UAE Premium (Rules 196).
 */

export type MarketScope = {
  /** Empty or ["*"] = global. Otherwise explicit market codes. */
  markets: string[];
};

export function parseMarketScope(
  raw: string[] | null | undefined,
): MarketScope {
  if (!raw || raw.length === 0) {
    return { markets: ["CZ"] }; // safe default — home market, not global
  }
  return { markets: raw.map((m) => m.trim().toUpperCase()) };
}

export function isGlobalMarketScope(scope: MarketScope): boolean {
  return scope.markets.includes("*");
}

export function marketScopeAllows(
  scope: MarketScope,
  marketCode: string,
): boolean {
  if (isGlobalMarketScope(scope)) return true;
  return scope.markets.includes(marketCode.toUpperCase());
}

export class EntitlementMarketScopeError extends Error {
  readonly code = "ENTITLEMENT_MARKET_SCOPE" as const;
  constructor(message: string) {
    super(message);
    this.name = "EntitlementMarketScopeError";
  }
}

/**
 * Gate: entitlement granted for CZ must not unlock AE features.
 */
export function assertEntitlementMarketScope(input: {
  productKey: string;
  marketScope: string[] | null | undefined;
  requestedMarketCode: string;
}): void {
  const scope = parseMarketScope(input.marketScope);
  if (!marketScopeAllows(scope, input.requestedMarketCode)) {
    throw new EntitlementMarketScopeError(
      `Product ${input.productKey} marketScope [${scope.markets.join(",")}] does not cover ${input.requestedMarketCode}.`,
    );
  }
}

export function entitlementCoversMarket(input: {
  marketScope: string[] | null | undefined;
  marketCode: string;
}): boolean {
  return marketScopeAllows(parseMarketScope(input.marketScope), input.marketCode);
}
