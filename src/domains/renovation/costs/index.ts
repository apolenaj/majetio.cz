export {
  type CostsService,
  type RenovationCostBand,
  type RenovationCostEstimate,
  type CostEstimateInput,
  type CostConfidenceLevel,
  type CostWarning,
  type PricedRenovationItem,
  type ProjectCostLine,
  COST_CONFIDENCE_LEVELS,
} from "./types";

export { estimateRenovationCosts, COST_MODEL_VERSION } from "./estimate";
export { createCostsService } from "./service";
export { sumBands, costBandFromUnitRates, type CostBand } from "./bands";
export {
  getCostCatalog,
  listCostCatalogVersions,
  lookupCatalogEntry,
  DEMO_COST_CATALOG_VERSION,
  type RenovationCostCatalog,
  type RenovationCostCatalogEntry,
} from "./catalog";
export {
  getLocationCostProfile,
  resolveLocationCostRegion,
  regionalCoefficient,
  DEMO_LOCATION_COST_VERSION,
  DEMO_LOCATION_COST_V2026_07,
  type LocationCostProfile,
} from "./regional";
export { computeProjectCosts } from "./project-costs";
export { resolveCostConfidence } from "./confidence";
export { priceScopeItems } from "./price-items";
export { costBucketForCategory, isFurnishingCategory } from "./furnishing";
