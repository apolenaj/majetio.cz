/**
 * DEMO DATA ONLY — baseline renovation durations by standard & category.
 */

import type { RenovationCategory, RenovationStandard } from "../scope/types";

export const DEMO_TIMELINE_MODEL_VERSION = "timeline.v2026.07-demo";

/** Base calendar weeks per renovation standard (empty shell → turn-key envelope). */
export const DEMO_STANDARD_BASE_WEEKS: Record<RenovationStandard, number> = {
  cosmetic: 2,
  light: 4,
  medium: 8,
  full: 14,
  premium: 18,
  custom: 10,
};

/** Additional weeks per scope category (parallelism already baked into standard). */
export const DEMO_CATEGORY_WEEK_WEIGHTS: Partial<
  Record<RenovationCategory, number>
> = {
  demolition: 1,
  structural: 4,
  electrical: 1.5,
  plumbing: 1.5,
  heating: 1,
  HVAC: 2,
  bathroom: 2,
  kitchen: 2.5,
  windows: 1,
  facade: 3,
  insulation: 2,
};

/** Categories that must complete before finishes (dependency chain). */
export const DEMO_FINISH_DEPENDENCIES: RenovationCategory[] = [
  "demolition",
  "structural",
  "electrical",
  "plumbing",
  "heating",
];

export const DEMO_TIMELINE_MULTIPLIERS = {
  optimistic: 0.82,
  delayed: 1.38,
  structureUnknownDelayWeeks: 3,
  dependencyOverlapFactor: 0.65,
};

export type DemoTimelineModel = {
  version: string;
  isDemo: boolean;
  standardBaseWeeks: Record<RenovationStandard, number>;
  categoryWeekWeights: Partial<Record<RenovationCategory, number>>;
  multipliers: typeof DEMO_TIMELINE_MULTIPLIERS;
  source: string;
};

export const DEMO_TIMELINE_MODEL: DemoTimelineModel = {
  version: DEMO_TIMELINE_MODEL_VERSION,
  isDemo: true,
  standardBaseWeeks: DEMO_STANDARD_BASE_WEEKS,
  categoryWeekWeights: DEMO_CATEGORY_WEEK_WEIGHTS,
  multipliers: DEMO_TIMELINE_MULTIPLIERS,
  source: "majetio-demo-timeline — NOT FOR PRODUCTION SCHEDULING",
};

export function getTimelineModel(version?: string): DemoTimelineModel {
  if (version && version !== DEMO_TIMELINE_MODEL_VERSION) {
    throw new Error(`Unknown timeline model version: ${version}`);
  }
  return DEMO_TIMELINE_MODEL;
}
