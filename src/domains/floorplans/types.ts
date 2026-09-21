/**
 * Floor plan domain types — versioned geometry + provenance.
 * Unknown dimensions stay null (never coerced to 0).
 */

export type FloorPlanOutputKind =
  | "SCHEMA_NO_SCALE"
  | "ORIENTATIONAL"
  | "INFORMANT_MEASURED"
  | "FROM_DOCUMENT"
  | "MODEL_DEMO";

export type FloorPlanScaleState = "NONE" | "PARTIAL" | "FULL";

export type DimensionSource =
  | "photo_observation"
  | "document"
  | "informant"
  | "model_demo"
  | "unknown";

export type RoomType =
  | "hallway"
  | "living"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "toilet"
  | "storage"
  | "balcony"
  | "staircase"
  | "other";

export type Point2 = { x: number; y: number };

export type FloorPlanOpening = {
  id: string;
  kind: "door" | "window" | "passage";
  /** Edge index on room polygon (0 = first edge). */
  edgeIndex: number;
  /** 0–1 along the edge. */
  t: number;
  widthM: number | null;
  swing?: "in_left" | "in_right" | "out_left" | "out_right" | "sliding" | "unknown";
  connectsToRoomId?: string | null;
};

export type FloorPlanRoom = {
  id: string;
  name: string;
  type: RoomType;
  floorId: string;
  /** Polygon in plan units (meters when scale known, else unitless). */
  polygon: Point2[];
  rotationDeg: number;
  lengthM: number | null;
  widthM: number | null;
  areaM2: number | null;
  areaSource: DimensionSource;
  wallLengthsM: Array<number | null> | null;
  openings: FloorPlanOpening[];
  notes: string | null;
  unclear: boolean;
  photoGroupIds: string[];
};

export type FloorPlanFloor = {
  id: string;
  name: string;
  level: number;
  rooms: FloorPlanRoom[];
};

export type FloorPlanPhotoGroup = {
  id: string;
  label: string;
  roomId: string | null;
  floorId: string | null;
  mediaIds: string[];
  excludeAsExterior: boolean;
  unclear: boolean;
};

export type FloorPlanSourceFile = {
  id: string;
  kind: "photo" | "floorplan_image" | "floorplan_pdf";
  url: string;
  mediaId: string | null;
  fileName: string;
  mimeType: string;
  pageIndex: number | null;
};

export type FloorPlanIssue = {
  code: string;
  messageCs: string;
  roomId?: string;
  severity: "info" | "warning" | "error";
};

export type FloorPlanDocument = {
  schemaVersion: 1;
  outputKind: FloorPlanOutputKind;
  scaleState: FloorPlanScaleState;
  units: "m" | "unitless";
  floors: FloorPlanFloor[];
  photoGroups: FloorPlanPhotoGroup[];
  sourceFiles: FloorPlanSourceFile[];
  showFurniture: boolean;
  issues: FloorPlanIssue[];
  listedAreaM2: number | null;
  roomsAreaSumM2: number | null;
  areaDifferenceNoteCs: string | null;
  disclaimerCs: string;
  /** Seller moved/edited geometry — protects against silent AI overwrite. */
  hasManualEdits?: boolean;
  /** Soft workflow hint stored in JSON (DB status remains authoritative). */
  statusHint?: "DRAFT" | "REVIEW_REQUIRED" | "PUBLISHED";
};

export const OUTPUT_KIND_LABEL_CS: Record<FloorPlanOutputKind, string> = {
  SCHEMA_NO_SCALE: "Schéma bez měřítka",
  ORIENTATIONAL: "Orientační půdorys",
  INFORMANT_MEASURED: "Půdorys s rozměry od inzerenta",
  FROM_DOCUMENT: "Půdorys z dodaného dokumentu",
  MODEL_DEMO: "Modelová dispozice (ukázka)",
};

export function disclaimerForKind(kind: FloorPlanOutputKind): string {
  switch (kind) {
    case "SCHEMA_NO_SCALE":
      return "Schéma bez měřítka. Neodvozujte z něj metry ani m². Dispozici ověřte při prohlídce.";
    case "ORIENTATIONAL":
      return "Orientační půdorys vytvořený s pomocí AI. Rozměry a dispozici ověřte při prohlídce.";
    case "INFORMANT_MEASURED":
      return "Rozměry zadal inzerent. Nejde o odborné zaměření.";
    case "FROM_DOCUMENT":
      return "Půdorys převzatý z dokumentu inzerenta. Přesnost závisí na podkladu — ověřte při prohlídce.";
    case "MODEL_DEMO":
      return "Modelová dispozice pro ukázkový inzerát. Nejde o rekonstrukci z ilustračních fotografií ani o skutečnou nabídku.";
  }
}

export function emptyFloorPlanDocument(
  partial?: Partial<FloorPlanDocument>,
): FloorPlanDocument {
  const floorId = "floor-0";
  return {
    schemaVersion: 1,
    outputKind: "SCHEMA_NO_SCALE",
    scaleState: "NONE",
    units: "unitless",
    floors: [{ id: floorId, name: "Přízemí", level: 0, rooms: [] }],
    photoGroups: [],
    sourceFiles: [],
    showFurniture: false,
    issues: [],
    listedAreaM2: null,
    roomsAreaSumM2: null,
    areaDifferenceNoteCs: null,
    disclaimerCs: disclaimerForKind("SCHEMA_NO_SCALE"),
    ...partial,
  };
}
