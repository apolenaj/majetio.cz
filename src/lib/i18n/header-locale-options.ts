import type { MarketSelectorOption } from "@/components/i18n/market-selector-types";
import { isMarketPubliclyActive } from "@/domains/markets";
import type { MarketRegistryEntry } from "@/domains/markets";
import { marketRegistry } from "@/domains/markets/registry/market-registry";

export function marketsForSelector(
  entries: MarketRegistryEntry[],
): MarketSelectorOption[] {
  return entries.map((e) => ({
    marketCode: e.marketCode,
    displayNameLocal: e.displayNameLocal,
    displayNameEn: e.displayNameEn,
    enabled: e.enabled,
    launchStatus: e.launchStatus,
    publiclyActive: isMarketPubliclyActive(e),
  }));
}

/** Server-only: options for header selectors (keeps registry out of client bundle). */
export function buildHeaderLocaleOptions(marketCode: string) {
  const markets = marketsForSelector([...marketRegistry.listAll()]);
  const entry =
    marketRegistry.get(marketCode) ?? marketRegistry.getHomeMarket();
  return {
    markets,
    locales: entry.supportedLocales as readonly string[],
  };
}
