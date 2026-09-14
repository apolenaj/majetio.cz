/**
 * Timeline — duration of works (supporting Concept C/D).
 * Duration only at item level; not cost or ARV.
 */

import type { RenovationScope } from "../scope/types";

export type DurationUnit = {
  weeks: number;
  months: number;
};

export type TimelineScenario = "optimistic" | "base" | "delayed";

export type RenovationTimelineEstimate = {
  optimistic: DurationUnit;
  base: DurationUnit;
  delayed: DurationUnit;
  /** Critical-path / dependency notes for UI. */
  dependencyNotes: string[];
  timelineModelVersion: string;
  modelIsDemo: boolean;
};

export type TimelineEstimateInput = {
  scope: RenovationScope;
  /** Unknown structure extends delayed track. */
  structureUnknown?: boolean;
  timelineModelVersion?: string;
};

export type TimelineService = {
  estimate(input: TimelineEstimateInput): Promise<RenovationTimelineEstimate>;
};

export function weeksToMonths(weeks: number): number {
  return Math.round((weeks / 4.33) * 10) / 10;
}

export function durationFromWeeks(weeks: number): DurationUnit {
  return { weeks: Math.round(weeks), months: weeksToMonths(weeks) };
}

export function pickTimelineDuration(
  estimate: RenovationTimelineEstimate,
  scenario: TimelineScenario,
): DurationUnit {
  return estimate[scenario];
}
