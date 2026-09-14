/**
 * Spain market-specific enums — no free-text local attributes.
 */

export const ES_ENERGY_CERTIFICATE = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "IN_PROCESS",
  "EXEMPT",
  "UNKNOWN",
] as const;
export type EsEnergyCertificate = (typeof ES_ENERGY_CERTIFICATE)[number];

export const ES_ORIENTATION = [
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "NORTHEAST",
  "NORTHWEST",
  "SOUTHEAST",
  "SOUTHWEST",
  "UNKNOWN",
] as const;
export type EsOrientation = (typeof ES_ORIENTATION)[number];

export const ES_HEATING_TYPE = [
  "CENTRAL",
  "INDIVIDUAL",
  "NONE",
  "UNKNOWN",
] as const;
export type EsHeatingType = (typeof ES_HEATING_TYPE)[number];
