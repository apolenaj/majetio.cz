/**
 * Cost catalog registry — versioned lookup.
 */

import { DEMO_COST_CATALOG_V2026_07, DEMO_COST_CATALOG_VERSION } from "./demo-cost-catalog.v2026.07";
import type {
  CatalogLookupInput,
  RenovationCostCatalog,
  RenovationCostCatalogEntry,
} from "./types";

export {
  DEMO_COST_CATALOG_VERSION,
  DEMO_COST_CATALOG_V2026_07,
} from "./demo-cost-catalog.v2026.07";

export type {
  CatalogLookupInput,
  RenovationCostCatalog,
  RenovationCostCatalogEntry,
} from "./types";

const CATALOGS: Record<string, RenovationCostCatalog> = {
  [DEMO_COST_CATALOG_VERSION]: DEMO_COST_CATALOG_V2026_07,
};

export function getCostCatalog(version?: string): RenovationCostCatalog {
  const key = version ?? DEMO_COST_CATALOG_VERSION;
  const catalog = CATALOGS[key];
  if (!catalog) {
    throw new Error(`Unknown renovation cost catalog version: ${key}`);
  }
  return catalog;
}

export function listCostCatalogVersions(): string[] {
  return Object.keys(CATALOGS);
}

/**
 * Find best matching catalog entry for a scope line item.
 * Prefers exact category + unit + quality; falls back to celek/standard/other.
 */
export function lookupCatalogEntry(
  catalog: RenovationCostCatalog,
  input: CatalogLookupInput,
): RenovationCostCatalogEntry | null {
  const { category, unit, qualityLevel } = input;

  const exact = catalog.entries.find(
    (e) =>
      e.category === category &&
      e.unit === unit &&
      e.qualityLevel === qualityLevel &&
      (e.region === "national" || e.region === input.region),
  );
  if (exact) {
    return exact;
  }

  const sameCategoryUnit = catalog.entries.find(
    (e) =>
      e.category === category &&
      e.unit === unit &&
      e.qualityLevel === "standard",
  );
  if (sameCategoryUnit) {
    return sameCategoryUnit;
  }

  const celekStandard = catalog.entries.find(
    (e) =>
      e.category === category &&
      e.unit === "celek" &&
      e.qualityLevel === qualityLevel,
  );
  if (celekStandard) {
    return celekStandard;
  }

  if (category !== "other") {
    return lookupCatalogEntry(catalog, {
      ...input,
      category: "other",
      unit: "celek",
      qualityLevel: "standard",
    });
  }

  return null;
}
