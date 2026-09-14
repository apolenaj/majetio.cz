/**
 * Renovation timeline estimation from scope + dependencies.
 */

import type { RenovationScope } from "../scope/types";
import {
  DEMO_TIMELINE_MODEL,
  DEMO_FINISH_DEPENDENCIES,
  getTimelineModel,
} from "./demo-timeline-model";
import {
  durationFromWeeks,
  type RenovationTimelineEstimate,
  type TimelineEstimateInput,
} from "./types";

function categoryWeeks(scope: RenovationScope): number {
  const weights = DEMO_TIMELINE_MODEL.categoryWeekWeights;
  let sum = 0;
  for (const item of scope.items) {
    sum += weights[item.category] ?? 0.3;
  }
  return sum * DEMO_TIMELINE_MODEL.multipliers.dependencyOverlapFactor;
}

function dependencyNotes(scope: RenovationScope): string[] {
  const categories = new Set(scope.items.map((i) => i.category));
  const notes: string[] = [];

  const prereqs = DEMO_FINISH_DEPENDENCIES.filter((c) => categories.has(c));
  if (prereqs.length > 0) {
    notes.push(
      `Kritická cesta: ${prereqs.join(" → ")} musí předcházet dokončovacím pracím.`,
    );
  }
  if (categories.has("kitchen") && categories.has("bathroom")) {
    notes.push("Kuchyně a koupelna běží paralelně po rozvodech TZB.");
  }
  if (categories.has("structural")) {
    notes.push("Statické zásahy prodlužují harmonogram a vyžadují statiku.");
  }

  return notes;
}

export function estimateRenovationTimeline(
  input: TimelineEstimateInput,
): RenovationTimelineEstimate {
  const model = getTimelineModel(input.timelineModelVersion);
  const { scope } = input;

  const baseStandard = model.standardBaseWeeks[scope.standard];
  const categoryExtra = categoryWeeks(scope);
  const baseWeeks = baseStandard + categoryExtra;

  const optimisticWeeks = baseWeeks * model.multipliers.optimistic;
  let delayedWeeks = baseWeeks * model.multipliers.delayed;
  if (input.structureUnknown) {
    delayedWeeks += model.multipliers.structureUnknownDelayWeeks;
  }

  return {
    optimistic: durationFromWeeks(optimisticWeeks),
    base: durationFromWeeks(baseWeeks),
    delayed: durationFromWeeks(delayedWeeks),
    dependencyNotes: dependencyNotes(scope),
    timelineModelVersion: model.version,
    modelIsDemo: model.isDemo,
  };
}
