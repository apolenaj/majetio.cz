/**
 * RenovationCostCatalog — versioned unit-rate database (Concept C).
 * Unit prices live only in catalog documents (demo or DB-backed later).
 */

import type { QualityLevel, RenovationCategory, RenovationUnit } from "../../scope/types";

export const COST_CATALOG_MARKETS = ["CZ"] as const;
export type CostCatalogMarket = (typeof COST_CATALOG_MARKETS)[number];

/** Region tag on catalog row — national rows get regional coefficient applied. */
export const COST_CATALOG_REGIONS = ["national", "praha", "cz_other"] as const;
export type CostCatalogRegion = (typeof COST_CATALOG_REGIONS)[number];

export type RenovationCostCatalogEntry = {
  id: string;
  category: RenovationCategory;
  /** Catalogue item label / stable key segment. */
  item: string;
  unit: RenovationUnit;
  qualityLevel: QualityLevel;
  lowCost: number;
  baseCost: number;
  highCost: number;
  currency: "CZK";
  market: CostCatalogMarket;
  region: CostCatalogRegion;
  validFrom: string;
  validTo: string | null;
  source: string;
  version: string;
};

export type RenovationCostCatalog = {
  version: string;
  market: CostCatalogMarket;
  /** True when loaded from code-backed demo fixture — not live market data. */
  isDemo: boolean;
  entries: RenovationCostCatalogEntry[];
  effectiveFrom: string;
  source: string;
};

export type CatalogLookupInput = {
  category: RenovationCategory;
  unit: RenovationUnit;
  qualityLevel: QualityLevel;
  region: CostCatalogRegion;
};
