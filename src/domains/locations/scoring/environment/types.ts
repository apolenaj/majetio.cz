/**
 * Environmental & development signals — official sources only.
 * Each signal carries source, date, and lifecycle status.
 */

export type EnvironmentalSignalType =
  | "FLOOD_ZONE"
  | "FLOOD_RISK_OVERLAY"
  | "PLANNED_CONSTRUCTION"
  | "UNDER_CONSTRUCTION"
  | "TRANSIT_PROJECT"
  | "METRO_EXTENSION"
  | "ZONING_CHANGE";

export type EnvironmentalSignalStatus =
  | "PLANNED"
  | "APPROVED"
  | "UNDER_CONSTRUCTION"
  | "OPERATIONAL"
  | "CANCELLED"
  | "UNKNOWN";

export type EnvironmentalSeverity = "info" | "caution" | "material";

export type EnvironmentalSignal = {
  id: string;
  type: EnvironmentalSignalType;
  status: EnvironmentalSignalStatus;
  title: string;
  description: string;
  source: string;
  sourceDate: string;
  /** When the signal was last verified by Majetio ingestion. */
  verifiedAt: string;
  severity: EnvironmentalSeverity;
  /** Optional official reference (e.g. DTM flood layer ID). */
  officialRef?: string | null;
};

export type EnvironmentalProfile = {
  locationId: string;
  signals: EnvironmentalSignal[];
  methodologyVersion: string;
  computedAt: string;
};

/** Impact on scoring dimensions — not a "safety score". */
export type EnvironmentalImpact = {
  signalId: string;
  dimension: import("@/domains/locations/scoring/types").LocationScoreDimension;
  /** Adjustment -30..+30 to dimension sub-score; 0 = informational only. */
  adjustment: number;
  reason: string;
};
