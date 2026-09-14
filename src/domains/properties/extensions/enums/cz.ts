/**
 * Czech market-specific enums (PENB, balcony kind, etc.).
 */

export const CZ_PENB_CLASS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "UNKNOWN",
] as const;
export type CzPenbClass = (typeof CZ_PENB_CLASS)[number];

export const CZ_BALCONY_KIND = [
  "BALCONY",
  "LOGGIA",
  "TERRACE",
  "NONE",
  "UNKNOWN",
] as const;
export type CzBalconyKind = (typeof CZ_BALCONY_KIND)[number];
