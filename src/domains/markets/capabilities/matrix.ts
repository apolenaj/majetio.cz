/**
 * Market Capability Matrix + per-market feature flags (Prompt 17.1).
 */

import {
  MARKET_CAPABILITY_KEYS,
  type CapabilityStatus,
  type MarketCapabilityKey,
} from "@/domains/markets/types";
import { emptyCapabilities } from "@/domains/markets/plugins/types";
import {
  getMarketPlugin,
  listMarketPlugins,
} from "@/domains/markets/plugins";

export type CapabilityMatrixRow = {
  marketCode: string;
  capabilities: Record<MarketCapabilityKey, CapabilityStatus>;
};

export type CapabilityMatrix = {
  capabilityKeys: readonly MarketCapabilityKey[];
  rows: CapabilityMatrixRow[];
};

/**
 * Build FULL × MARKET matrix. Missing plugin capabilities → NOT_AVAILABLE.
 */
export function buildCapabilityMatrix(): CapabilityMatrix {
  const rows = listMarketPlugins().map((plugin) => {
    const base = emptyCapabilities("NOT_AVAILABLE");
    for (const key of MARKET_CAPABILITY_KEYS) {
      const status = plugin.capabilities[key];
      if (status) base[key] = status;
    }
    return { marketCode: plugin.marketCode, capabilities: base };
  });
  return { capabilityKeys: MARKET_CAPABILITY_KEYS, rows };
}

export function getMarketCapability(
  marketCode: string,
  capability: MarketCapabilityKey,
): CapabilityStatus {
  const plugin = getMarketPlugin(marketCode);
  if (!plugin) return "NOT_AVAILABLE";
  return plugin.capabilities[capability] ?? "NOT_AVAILABLE";
}

/** Env key convention: MARKET_{CODE}_{FEATURE}_ENABLED */
export function marketFeatureFlagKey(
  marketCode: string,
  feature: string,
): string {
  return `MARKET_${marketCode.toUpperCase()}_${feature.toUpperCase()}_ENABLED`;
}

/**
 * Resolve boolean market flag.
 * Env override wins; else plugin featureFlagDefaults; else false.
 */
export function isMarketFeatureEnabled(
  marketCode: string,
  feature: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const key = marketFeatureFlagKey(marketCode, feature);
  const raw = env[key];
  if (raw === "true") return true;
  if (raw === "false") return false;

  const plugin = getMarketPlugin(marketCode);
  if (!plugin) return false;
  if (key in plugin.featureFlagDefaults) {
    return Boolean(plugin.featureFlagDefaults[key]);
  }
  // Convenience: MARKET_CZ_VALUATION_ENABLED ↔ capability VALUATION
  const capKey = feature.toUpperCase() as MarketCapabilityKey;
  if ((MARKET_CAPABILITY_KEYS as readonly string[]).includes(capKey)) {
    const status = plugin.capabilities[capKey];
    return status === "FULL" || status === "BETA";
  }
  return false;
}

/** Snapshot of all known market feature flag defaults (+ env overrides). */
export function getMarketFeatureFlagSnapshot(
  env: NodeJS.ProcessEnv = process.env,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const plugin of listMarketPlugins()) {
    for (const key of Object.keys(plugin.featureFlagDefaults)) {
      const feature = key
        .replace(new RegExp(`^MARKET_${plugin.marketCode}_`), "")
        .replace(/_ENABLED$/, "");
      out[key] = isMarketFeatureEnabled(plugin.marketCode, feature, env);
    }
  }
  return out;
}

/**
 * Valuation convenience — Prompt example MARKET_CZ_VALUATION_ENABLED.
 */
export function isMarketValuationEnabled(marketCode: string): boolean {
  return isMarketFeatureEnabled(marketCode, "VALUATION");
}
