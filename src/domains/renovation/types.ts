/**
 * Renovation domain — shared entity types (Prompt 1/5).
 * Prisma-aligned; no calculation logic here.
 */

/** How the renovation analysis was produced (domain + Prisma-aligned). */
export const RENOVATION_ANALYSIS_TYPES = [
  "AUTOMATIC",
  "USER_DEFINED",
  "ANALYST_ADJUSTED",
  "PROFESSIONAL",
] as const;

export type RenovationAnalysisType =
  (typeof RENOVATION_ANALYSIS_TYPES)[number];

/** Lifecycle of a renovation analysis row. */
export const RENOVATION_ANALYSIS_STATUSES = [
  "DRAFT",
  "CALCULATED",
  "PARTIAL",
  "FAILED",
  "STALE",
  "ARCHIVED",
] as const;

export type RenovationAnalysisStatus =
  (typeof RENOVATION_ANALYSIS_STATUSES)[number];

/**
 * Primary persisted renovation analysis.
 *
 * Concept boundaries (do not conflate in consumers):
 * - Condition (A) → inputs live under condition services, not cost/ARV.
 * - Scope (B) → referenced via `scopeVersion` (+ future scope snapshot).
 * - Costs (C) → `estimatedLow|Base|High`, `contingencyAmount`, `costModelVersion`.
 * - ARV (D) → future fields / arv services — not stored as cost.
 */
export type RenovationAnalysis = {
  id: string;
  propertyId: string | null;
  analysisId: string | null;
  scenarioId: string | null;
  type: RenovationAnalysisType;
  status: RenovationAnalysisStatus;
  /** Frozen scope catalogue / definition version. */
  scopeVersion: string;
  /** Frozen cost model / unit-rate table version. */
  costModelVersion: string;
  /** Frozen location cost index version. */
  locationCostVersion: string;
  /**
   * Cost band in CZK major units (whole koruný).
   * `null` = not yet calculated / insufficient data — never invent 0.
   */
  estimatedLow: number | null;
  estimatedBase: number | null;
  estimatedHigh: number | null;
  /** Contingency amount in CZK major (concept C support) — not ARV. */
  contingencyAmount: number | null;
  /** Estimated duration in whole days. */
  estimatedDuration: number | null;
  /** Confidence 0–100; null when insufficient inputs. */
  confidence: number | null;
  createdAt: Date;
  updatedAt: Date;
  calculatedAt: Date | null;
};

/** Create input — ids and versions supplied by orchestration later. */
export type RenovationAnalysisCreateInput = {
  propertyId?: string | null;
  analysisId?: string | null;
  scenarioId?: string | null;
  type: RenovationAnalysisType;
  status?: RenovationAnalysisStatus;
  scopeVersion: string;
  costModelVersion: string;
  locationCostVersion: string;
  estimatedLow?: number | null;
  estimatedBase?: number | null;
  estimatedHigh?: number | null;
  contingencyAmount?: number | null;
  estimatedDuration?: number | null;
  confidence?: number | null;
  calculatedAt?: Date | null;
};

export type RenovationAnalysisUpdateInput = Partial<
  Omit<RenovationAnalysisCreateInput, "propertyId" | "analysisId" | "scenarioId">
> & {
  status?: RenovationAnalysisStatus;
  calculatedAt?: Date | null;
};
