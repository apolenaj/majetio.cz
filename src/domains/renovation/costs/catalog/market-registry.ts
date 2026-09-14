/**
 * Market-scoped renovation cost catalog access (Prompt 17.4).
 * Catalog must be market-specific or explicitly unavailable.
 */

import {
  getCostCatalog,
  DEMO_COST_CATALOG_VERSION,
} from "@/domains/renovation/costs/catalog";
import type { RenovationCostCatalog } from "@/domains/renovation/costs/catalog/types";

export type RenovationCatalogResolution =
  | {
      status: "READY";
      catalog: RenovationCostCatalog;
    }
  | {
      status: "UNAVAILABLE";
      marketCode: string;
      messageEn: string;
    };

const MARKET_CATALOG_VERSION: Record<string, string> = {
  CZ: DEMO_COST_CATALOG_VERSION,
};

export function resolveRenovationCostCatalog(
  marketCode: string,
): RenovationCatalogResolution {
  const code = marketCode.toUpperCase();
  const version = MARKET_CATALOG_VERSION[code];
  if (!version) {
    return {
      status: "UNAVAILABLE",
      marketCode: code,
      messageEn: `Renovation cost catalog unavailable for market ${code}.`,
    };
  }
  return {
    status: "READY",
    catalog: getCostCatalog(version),
  };
}

export function isRenovationCostCatalogAvailable(marketCode: string): boolean {
  return resolveRenovationCostCatalog(marketCode).status === "READY";
}
