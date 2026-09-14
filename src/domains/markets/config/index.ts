/**
 * Market config surface — re-exports registry definitions for consumers
 * that should not import plugins directly.
 */

export { marketRegistry } from "@/domains/markets/registry/market-registry";
export {
  buildCapabilityMatrix,
  isMarketFeatureEnabled,
  isMarketValuationEnabled,
  marketFeatureFlagKey,
} from "@/domains/markets/capabilities/matrix";
export type { MarketDefinition, LaunchStatus } from "@/domains/markets/types";
