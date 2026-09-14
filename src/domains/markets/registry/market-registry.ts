/**
 * Central MarketRegistry — single source of truth for markets (Prompt 17.1).
 */

import type {
  LaunchStatus,
  MarketDefinition,
  MarketPublicSurface,
  MarketRegionDefinition,
} from "@/domains/markets/types";
import { PUBLIC_LAUNCH_STATUSES } from "@/domains/markets/types";
import { toMarketCode } from "@/domains/markets/codes";
import { getMarketPlugin, listMarketPlugins } from "@/domains/markets/plugins";
import type { MarketPlugin } from "@/domains/markets/plugins/types";

const PUBLIC_SET = new Set<string>(PUBLIC_LAUNCH_STATUSES);

export type MarketRegistryEntry = MarketDefinition & {
  plugin: MarketPlugin;
};

function toEntry(plugin: MarketPlugin): MarketRegistryEntry {
  return {
    ...plugin.definition,
    regions: plugin.regions ?? plugin.definition.regions,
    plugin,
  };
}

/**
 * Why a market must not appear as "active" in public UI.
 */
export function reasonMarketNotPubliclyActive(
  def: MarketDefinition,
): string | null {
  if (!def.enabled) {
    return "Market is disabled (enabled=false).";
  }
  if (!PUBLIC_SET.has(def.launchStatus)) {
    return `Launch status ${def.launchStatus} is not public (need BETA or LIVE).`;
  }
  if (!def.hasMinimumPublicData) {
    return "Insufficient public data — UI must not present market as active.";
  }
  return null;
}

export function isMarketPubliclyActive(def: MarketDefinition): boolean {
  return reasonMarketNotPubliclyActive(def) === null;
}

export class MarketRegistry {
  listAll(): MarketRegistryEntry[] {
    return listMarketPlugins().map(toEntry);
  }

  get(marketCode: string): MarketRegistryEntry | null {
    const plugin = getMarketPlugin(marketCode);
    return plugin ? toEntry(plugin) : null;
  }

  /** Typed accessor — throws on unknown MarketCode. */
  require(marketCode: string): MarketRegistryEntry {
    const code = toMarketCode(marketCode);
    const entry = this.get(code);
    if (!entry) {
      throw new Error(`Market plugin missing for MarketCode ${code}`);
    }
    return entry;
  }

  /** Default / home market for current Majetio.cz Core deploy. */
  getHomeMarket(): MarketRegistryEntry {
    const cz = this.get("CZ");
    if (!cz) {
      throw new Error("CZ market plugin missing — Core misconfigured.");
    }
    return cz;
  }

  listPubliclyActive(): MarketRegistryEntry[] {
    return this.listAll().filter((m) => isMarketPubliclyActive(m));
  }

  toPublicSurface(marketCode: string): MarketPublicSurface | null {
    const entry = this.get(marketCode);
    if (!entry) return null;
    const reason = reasonMarketNotPubliclyActive(entry);
    return {
      marketCode: entry.marketCode,
      displayNameEn: entry.displayNameEn,
      displayNameLocal: entry.displayNameLocal,
      defaultLocale: entry.defaultLocale,
      defaultCurrency: entry.defaultCurrency,
      launchStatus: entry.launchStatus,
      publiclyActive: reason === null,
      reasonIfHidden: reason,
    };
  }

  listPublicSurfaces(): MarketPublicSurface[] {
    return this.listAll()
      .map((m) => this.toPublicSurface(m.marketCode)!)
      .filter(Boolean);
  }

  listRegions(marketCode: string): readonly MarketRegionDefinition[] {
    return this.get(marketCode)?.regions ?? [];
  }

  /**
   * Resolve region under a market (e.g. bali under ID).
   * Never promotes region to a country-level marketCode.
   */
  resolveRegion(
    marketCode: string,
    regionCode: string,
  ): MarketRegionDefinition | null {
    const regions = this.listRegions(marketCode);
    return (
      regions.find(
        (r) => r.regionCode.toLowerCase() === regionCode.toLowerCase(),
      ) ?? null
    );
  }
}

/** Process-wide singleton. */
export const marketRegistry = new MarketRegistry();
