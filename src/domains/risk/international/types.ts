/**
 * International Risk Model (Rules 138, 163–174).
 *
 * Multi-dimensional facts only — NEVER collapse into a single score
 * (e.g. "UAE risk 4/10" is forbidden).
 */

export const INTERNATIONAL_RISK_DIMENSIONS = [
  "MARKET",
  "CURRENCY",
  "LEGAL",
  "FINANCING",
  "TAX",
  "LIQUIDITY",
  "OPERATIONAL",
  "DATA_QUALITY",
] as const;

export type InternationalRiskDimension =
  (typeof INTERNATIONAL_RISK_DIMENSIONS)[number];

export const RISK_FACT_SEVERITIES = [
  "info",
  "watch",
  "elevated",
  "critical",
] as const;

export type RiskFactSeverity = (typeof RISK_FACT_SEVERITIES)[number];

/**
 * One atomic, evidence-backed risk fact.
 * Prefer structured codes (foreign_ownership_restricted) over prose scores.
 */
export type InternationalRiskFact = {
  /** Stable fact id within market pack, e.g. ae.legal.foreign_ownership.restricted */
  code: string;
  dimension: InternationalRiskDimension;
  severity: RiskFactSeverity;
  titleEn: string;
  /** Short factual statement — not a score. */
  statementEn: string;
  /** Machine-readable evidence (rule codes, metrics, source keys). */
  evidence: {
    regulatoryRuleCodes?: string[];
    dataSourceKeys?: string[];
    metricKey?: string;
    metricValue?: number | null;
    notesEn?: string;
  };
  /** When this fact pack item was last reviewed. */
  reviewedAt: string | null;
  /** Demo / research facts must not be treated as live legal advice. */
  isDemo: boolean;
};

export type InternationalRiskModel = {
  marketCode: string;
  version: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  isDemo: boolean;
  /** Explicit: this model has no aggregate score field by design. */
  aggregateScore: null;
  facts: readonly InternationalRiskFact[];
  disclaimerEn: string;
};

export class AggregateRiskScoreForbiddenError extends Error {
  constructor(message = "International Risk Model forbids aggregate numeric scores.") {
    super(message);
    this.name = "AggregateRiskScoreForbiddenError";
  }
}

/** Guard — refuse inventing a 1–10 style score from facts. */
export function assertNoAggregateRiskScore(value: unknown): void {
  if (!value || typeof value !== "object") return;
  const obj = value as Record<string, unknown>;
  if (typeof obj.score === "number" || typeof obj.riskScore === "number") {
    throw new AggregateRiskScoreForbiddenError();
  }
  if (obj.aggregateScore != null && typeof obj.aggregateScore === "number") {
    throw new AggregateRiskScoreForbiddenError();
  }
}

export function listFactsByDimension(
  model: InternationalRiskModel,
  dimension: InternationalRiskDimension,
): InternationalRiskFact[] {
  return model.facts.filter((f) => f.dimension === dimension);
}

export function filterProductionFacts(
  model: InternationalRiskModel,
): InternationalRiskFact[] {
  if (model.isDemo) return [];
  return model.facts.filter((f) => !f.isDemo);
}
