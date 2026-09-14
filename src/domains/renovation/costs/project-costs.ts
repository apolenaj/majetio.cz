/**
 * Project costs — architect, permits, supervision (% of construction base).
 */

import { multiplyBandByRates, sumBands, type CostBand } from "./bands";
import {
  getProjectCostRates,
  type ProjectCostRateModel,
} from "./project-cost-rates";
import type { ProjectCostLine } from "./types";

const PROJECT_LABELS = {
  architect: "Architekt / projektová dokumentace",
  permits: "Povolení a poplatky",
  supervision: "Stavební dozor / koordinace",
} as const;

export function computeProjectCosts(
  constructionBand: CostBand,
  version?: string,
): { lines: ProjectCostLine[]; total: CostBand; model: ProjectCostRateModel } {
  const model = getProjectCostRates(version);

  const lines: ProjectCostLine[] = (
    ["architect", "permits", "supervision"] as const
  ).map((code) => ({
    code,
    label: PROJECT_LABELS[code],
    band: multiplyBandByRates(constructionBand, model[code]),
  }));

  return {
    lines,
    total: sumBands(lines.map((l) => l.band)),
    model,
  };
}
