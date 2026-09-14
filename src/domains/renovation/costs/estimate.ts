/**
 * Cost Engine — prices RenovationScope via RenovationCostCatalog.
 * Always returns low/base/high intervals; never a single absolute figure.
 */

import type { RenovationConditionAssessment } from "../condition/types";
import {
  calculateContingency,
  collectContingencyWarnings,
} from "../contingency/calculate";
import { assertBandOrder, sumBands, type CostBand } from "./bands";
import { resolveCostConfidence } from "./confidence";
import { getCostCatalog, DEMO_COST_CATALOG_VERSION } from "./catalog";
import { computeProjectCosts } from "./project-costs";
import { DEMO_PROJECT_COST_VERSION } from "./project-cost-rates";
import { priceScopeItems } from "./price-items";
import {
  getLocationCostProfile,
  regionalCoefficient,
  resolveLocationCostRegion,
  DEMO_LOCATION_COST_VERSION,
} from "./regional";
import type {
  CostEstimateInput,
  CostWarning,
  RenovationCostEstimate,
} from "./types";

export const COST_MODEL_VERSION = "cost.v2026.07";

const EMPTY_BAND: CostBand = { lowCzk: 0, baseCzk: 0, highCzk: 0 };

function conditionWarnings(
  condition?: RenovationConditionAssessment | null,
): CostWarning[] {
  const warnings: CostWarning[] = [];
  if (!condition) {
    return warnings;
  }
  if (condition.isPartial) {
    warnings.push({
      code: "partial_condition_data",
      severity: "warning",
      message:
        "Hodnocení stavu je neúplné — rezerva a confidence mohou být konzervativnější.",
    });
  }
  if (condition.areas.structure.status === "unknown") {
    warnings.push({
      code: "structure_unknown",
      severity: "warning",
      message:
        "Stav konstrukce není znám — statické zásahy nejsou spolehlivě odhadnutelné.",
    });
  }
  return warnings;
}

/**
 * Main cost estimation pipeline (Concept C).
 */
export function estimateRenovationCosts(
  input: CostEstimateInput,
): RenovationCostEstimate {
  const catalogVersion = input.catalogVersion ?? DEMO_COST_CATALOG_VERSION;
  const locationCostVersion =
    input.locationCostVersion ?? DEMO_LOCATION_COST_VERSION;

  const catalog = getCostCatalog(catalogVersion);
  const locationProfile = getLocationCostProfile(locationCostVersion);
  const locationRegion = resolveLocationCostRegion(input.location ?? {});
  const coef = regionalCoefficient(locationProfile, locationRegion);

  const pricing = priceScopeItems({
    items: input.scope.items,
    catalog,
    regionalCoefficient: coef,
    locationRegion,
    propertyAreaSqm: input.propertyAreaSqm,
  });

  const warnings: CostWarning[] = [
    ...conditionWarnings(input.conditionAssessment),
    ...pricing.warnings,
    ...collectContingencyWarnings({
      conditionAssessment: input.conditionAssessment,
      scope: input.scope,
    }),
  ];

  const construction =
    pricing.constructionBands.length > 0
      ? sumBands(pricing.constructionBands)
      : { ...EMPTY_BAND };

  const furnishing =
    pricing.furnishingBands.length > 0
      ? sumBands(pricing.furnishingBands)
      : { ...EMPTY_BAND };

  const project = computeProjectCosts(
    construction,
    input.projectCostVersion ?? DEMO_PROJECT_COST_VERSION,
  );

  const subtotalBeforeContingency = sumBands([construction, project.total]);

  const contingency = calculateContingency({
    constructionBase: construction,
    subtotalBeforeContingency,
    conditionAssessment: input.conditionAssessment,
    scope: input.scope,
    modelVersion: input.contingencyModelVersion,
  });

  warnings.push(...contingency.warnings);

  const totalInvestment = sumBands([
    construction,
    project.total,
    contingency.band,
    furnishing,
  ]);

  for (const band of [
    construction,
    furnishing,
    project.total,
    subtotalBeforeContingency,
    contingency.band,
    totalInvestment,
  ]) {
    assertBandOrder(band);
  }

  const { level, score } = resolveCostConfidence({
    scope: input.scope,
    conditionAssessment: input.conditionAssessment,
    pricedItems: pricing.pricedItems,
    warnings,
  });

  return {
    construction,
    furnishing,
    projectCosts: {
      lines: project.lines,
      total: project.total,
    },
    contingency,
    subtotalBeforeContingency,
    totalInvestment,
    confidence: level,
    confidenceScore: score,
    warnings,
    pricedItems: pricing.pricedItems,
    costModelVersion: input.costModelVersion ?? COST_MODEL_VERSION,
    locationCostVersion,
    catalogVersion,
    catalogIsDemo: catalog.isDemo,
  };
}
