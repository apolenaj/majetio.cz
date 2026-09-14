/**
 * Market-specific enums — never free-text for local attributes (Rules 155–157).
 */

export const UAE_FURNISHING = [
  "UNFURNISHED",
  "SEMI_FURNISHED",
  "FURNISHED",
  "UNKNOWN",
] as const;
export type UaeFurnishing = (typeof UAE_FURNISHING)[number];

export const UAE_VIEW_TYPE = [
  "SEA",
  "CITY",
  "COMMUNITY",
  "GOLF",
  "LAGOON",
  "PARK",
  "NONE",
  "UNKNOWN",
] as const;
export type UaeViewType = (typeof UAE_VIEW_TYPE)[number];

export const UAE_PARKING_TYPE = [
  "COVERED",
  "OPEN",
  "BASEMENT",
  "NONE",
  "UNKNOWN",
] as const;
export type UaeParkingType = (typeof UAE_PARKING_TYPE)[number];

/** DLD / RERA regulatory identifiers — structured, not free prose. */
export const UAE_PERMIT_KINDS = ["DLD", "RERA", "OTHER"] as const;
export type UaePermitKind = (typeof UAE_PERMIT_KINDS)[number];
