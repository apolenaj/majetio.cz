/**
 * Dynamic contingency calculation + hidden-defect warnings.
 */

import { roundCzk, type CostBand } from "../costs/bands";
import type { RenovationConditionAssessment } from "../condition/types";
import type { RenovationScope } from "../scope/types";
import {
  DEMO_CONTINGENCY_MODEL_VERSION,
  getContingencyModel,
} from "./demo-contingency-model";
import type {
  ContingencyEstimateInput,
  ContingencyResult,
  ContingencyRiskFactor,
} from "./types";
import type { CostWarning } from "../costs/types";

export function collectContingencyWarnings(input: {
  conditionAssessment?: RenovationConditionAssessment | null;
  scope?: RenovationScope;
}): CostWarning[] {
  const warnings: CostWarning[] = [];
  const condition = input.conditionAssessment;

  if (!condition) {
    return warnings;
  }

  const structureUnknown = condition.areas.structure.status === "unknown";
  const poorOverall =
    condition.propertyCondition === "NEEDS_RENOVATION" ||
    condition.propertyCondition === "SHELL" ||
    (condition.severityScore ?? 0) >= 70;

  if (structureUnknown && poorOverall) {
    warnings.push({
      code: "hidden_defects_risk",
      severity: "critical",
      message:
        "Vysoké riziko skrytých vad (neznámá konstrukce + špatný stav). Rezerva je navýšena — doporučujeme inspekci.",
    });
  } else if (structureUnknown) {
    warnings.push({
      code: "hidden_defects_risk",
      severity: "warning",
      message:
        "Neznámý stav konstrukce zvyšuje riziko skrytých vad. Zvažte technickou inspekci.",
    });
  }

  return warnings;
}

function resolveContingencyRate(input: ContingencyEstimateInput): {
  rate: number;
  factors: ContingencyRiskFactor[];
} {
  const model = getContingencyModel(input.modelVersion);
  const scope = input.scope;
  const condition = input.conditionAssessment;

  const standard = scope?.standard ?? "medium";
  let rate = model.baseRatesByStandard[standard];
  const factors: ContingencyRiskFactor[] = [
    {
      code: "standard_base",
      label: `Základ dle standardu (${standard})`,
      rateDelta: rate,
    },
  ];

  if (condition?.areas.structure.status === "unknown") {
    rate += model.modifiers.structureUnknown;
    factors.push({
      code: "structure_unknown",
      label: "Neznámá konstrukce",
      rateDelta: model.modifiers.structureUnknown,
    });
  }

  if (condition?.isPartial) {
    rate += model.modifiers.conditionPartial;
    factors.push({
      code: "condition_partial",
      label: "Neúplná data o stavu",
      rateDelta: model.modifiers.conditionPartial,
    });
  }

  const severity = condition?.severityScore ?? null;
  if (severity !== null && severity >= 85) {
    rate += model.modifiers.severityAbove85;
    factors.push({
      code: "severity_high",
      label: "Velmi špatný agregovaný stav",
      rateDelta: model.modifiers.severityAbove85,
    });
  } else if (severity !== null && severity >= 70) {
    rate += model.modifiers.severityAbove70;
    factors.push({
      code: "severity_elevated",
      label: "Zhoršený agregovaný stav",
      rateDelta: model.modifiers.severityAbove70,
    });
  }

  if (condition?.propertyCondition === "SHELL") {
    rate += model.modifiers.shellCondition;
    factors.push({
      code: "shell_condition",
      label: "Stav shell / hrubá stavba",
      rateDelta: model.modifiers.shellCondition,
    });
  }

  if (condition?.propertyCondition === "NEEDS_RENOVATION") {
    rate += model.modifiers.needsRenovation;
    factors.push({
      code: "needs_renovation",
      label: "Nemovitost k rekonstrukci",
      rateDelta: model.modifiers.needsRenovation,
    });
  }

  if (scope?.origin === "user_defined") {
    rate += model.modifiers.userDefinedScope;
    factors.push({
      code: "user_defined_scope",
      label: "Uživatelsky upravený rozsah",
      rateDelta: model.modifiers.userDefinedScope,
    });
  }

  rate = Math.max(model.floor, Math.min(model.cap, rate));

  return { rate, factors };
}

export function calculateContingency(
  input: ContingencyEstimateInput,
): ContingencyResult {
  const model = getContingencyModel(input.modelVersion);
  const { rate, factors } = resolveContingencyRate(input);
  const base = input.constructionBase;

  const band: CostBand = {
    lowCzk: roundCzk(base.lowCzk * rate * 0.85),
    baseCzk: roundCzk(base.baseCzk * rate),
    highCzk: roundCzk(base.highCzk * rate * 1.25),
  };

  return {
    band,
    rateRatio: rate,
    riskFactors: factors,
    warnings: collectContingencyWarnings({
      conditionAssessment: input.conditionAssessment,
      scope: input.scope,
    }),
    contingencyModelVersion:
      input.modelVersion ?? DEMO_CONTINGENCY_MODEL_VERSION,
    modelIsDemo: model.isDemo,
  };
}
