/**
 * Plugin loader — register markets without touching Core.
 */

import type { MarketPlugin } from "@/domains/markets/plugins/types";
import { czMarketPlugin } from "@/domains/markets/plugins/cz";
import { skMarketPlugin } from "@/domains/markets/plugins/sk";
import { esMarketPlugin } from "@/domains/markets/plugins/es";
import { itMarketPlugin } from "@/domains/markets/plugins/it";
import { hrMarketPlugin } from "@/domains/markets/plugins/hr";
import { aeMarketPlugin } from "@/domains/markets/plugins/ae";
import { saMarketPlugin } from "@/domains/markets/plugins/sa";
import { idMarketPlugin } from "@/domains/markets/plugins/id";

/** Canonical ordered catalog of market plugins (Prompt 17.1 seed set). */
export const MARKET_PLUGINS: readonly MarketPlugin[] = [
  czMarketPlugin,
  skMarketPlugin,
  esMarketPlugin,
  itMarketPlugin,
  hrMarketPlugin,
  aeMarketPlugin,
  saMarketPlugin,
  idMarketPlugin,
] as const;

export const MARKET_PLUGIN_BY_CODE: ReadonlyMap<string, MarketPlugin> = new Map(
  MARKET_PLUGINS.map((p) => [p.marketCode, p]),
);

export function getMarketPlugin(marketCode: string): MarketPlugin | null {
  return MARKET_PLUGIN_BY_CODE.get(marketCode.toUpperCase()) ?? null;
}

export function listMarketPlugins(): readonly MarketPlugin[] {
  return MARKET_PLUGINS;
}
