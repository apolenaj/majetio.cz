/**
 * DEMO DATA ONLY — contingency rate model (not unit prices).
 */

import type { RenovationStandard } from "../scope/types";

export const DEMO_CONTINGENCY_MODEL_VERSION = "contingency.v2026.07-demo";

export type ContingencyRateModel = {
  version: string;
  isDemo: boolean;
  baseRatesByStandard: Record<RenovationStandard, number>;
  modifiers: {
    structureUnknown: number;
    conditionPartial: number;
    severityAbove70: number;
    severityAbove85: number;
    userDefinedScope: number;
    shellCondition: number;
    needsRenovation: number;
  };
  floor: number;
  cap: number;
  source: string;
};

export const DEMO_CONTINGENCY_MODEL: ContingencyRateModel = {
  version: DEMO_CONTINGENCY_MODEL_VERSION,
  isDemo: true,
  baseRatesByStandard: {
    cosmetic: 0.05,
    light: 0.08,
    medium: 0.12,
    full: 0.15,
    premium: 0.18,
    custom: 0.14,
  },
  modifiers: {
    structureUnknown: 0.05,
    conditionPartial: 0.03,
    severityAbove70: 0.04,
    severityAbove85: 0.06,
    userDefinedScope: 0.02,
    shellCondition: 0.06,
    needsRenovation: 0.03,
  },
  floor: 0.05,
  cap: 0.35,
  source: "majetio-demo-contingency — NOT FOR PRODUCTION PRICING",
};

export function getContingencyModel(version?: string): ContingencyRateModel {
  if (version && version !== DEMO_CONTINGENCY_MODEL_VERSION) {
    throw new Error(`Unknown contingency model version: ${version}`);
  }
  return DEMO_CONTINGENCY_MODEL;
}
