import "server-only";

/**
 * Server-only floor plan API — persistence, auth, analysis jobs.
 * Client components must not import this module.
 */

export {
  getOrCreateFloorPlanForProperty,
  saveFloorPlanDraft,
  publishFloorPlan,
  loadPublishedFloorPlan,
  enqueuePhotoAnalysisJob,
} from "./service";
