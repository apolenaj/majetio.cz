/**
 * Risk summary by severity — critical / high / medium / low (BOD 97, 98).
 */

import type {
  RiskDecisionItem,
  RiskDecisionSummary,
  RiskSeverity,
} from "./types";

const SEVERITY_ORDER: RiskSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
];

export function emptyRiskCounts(): Record<RiskSeverity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0 };
}

export function summarizeRisks(items: RiskDecisionItem[]): RiskDecisionSummary {
  const counts = emptyRiskCounts();
  for (const item of items) {
    counts[item.severity] += 1;
  }
  const topSeverity =
    SEVERITY_ORDER.find((s) => counts[s] > 0) ?? null;
  return { counts, items, topSeverity };
}

/** Map investment engine flag severity → decision severity. */
export function mapFlagSeverity(
  severity: "info" | "warning" | "critical",
): RiskSeverity {
  if (severity === "critical") return "critical";
  if (severity === "warning") return "high";
  return "medium";
}

export function mapListingRisk(
  risk: string | null | undefined,
): RiskSeverity | null {
  if (!risk) return null;
  const r = risk.toLowerCase();
  if (r === "critical") return "critical";
  if (r === "high") return "high";
  if (r === "medium") return "medium";
  if (r === "low") return "low";
  return null;
}
