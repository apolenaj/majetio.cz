import { estimateRenovationTimeline } from "./estimate";
import type { TimelineEstimateInput, TimelineService } from "./types";

export function createTimelineService(): TimelineService {
  return {
    async estimate(input: TimelineEstimateInput) {
      return estimateRenovationTimeline(input);
    },
  };
}
