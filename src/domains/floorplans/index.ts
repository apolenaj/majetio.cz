/**
 * Client-safe floor plan barrel — types, geometry, SVG, demo data, merge helpers.
 * Never re-export persistence / Prisma / storage from here.
 */

export type {
  FloorPlanDocument,
  FloorPlanOutputKind,
  FloorPlanScaleState,
  FloorPlanRoom,
  FloorPlanFloor,
  FloorPlanIssue,
  FloorPlanPhotoGroup,
  DimensionSource,
  RoomType,
  Point2,
} from "./types";
export {
  OUTPUT_KIND_LABEL_CS,
  disclaimerForKind,
  emptyFloorPlanDocument,
} from "./types";
export {
  polygonArea,
  rectPolygon,
  validateFloorPlanDocument,
  recomputeRoomAreas,
  isSelfIntersecting,
  polygonsAabbOverlap,
} from "./geometry";
export { renderFloorPlanSvg } from "./svg-render";
export { DEMO_2KK_FLOOR_PLAN } from "./demo-2kk";
export {
  documentHasManualEdits,
  mergeAnalysisProposal,
  markManualEdit,
  type AnalysisProposal,
} from "./merge";
