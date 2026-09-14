/**
 * Property-level Decision Readiness — rule-based low/medium/ready.
 * Reuses presence of Majetio / Match / Location (and financing / condition checks).
 * Does NOT invent a new abstract readiness score.
 */

import { comparisonConfig } from "@/config/comparison";

export type PropertyReadinessStatus =
  | "low"
  | "medium"
  | "ready_for_decision";

export type PropertyReadinessResult = {
  status: PropertyReadinessStatus;
  missingCs: string[];
  /** Always framed as missing inputs — never a purchase verdict. */
  headlineCs: string;
};

export function buildPropertyDecisionReadiness(input: {
  hasAskingPrice: boolean;
  hasValuation: boolean;
  /** Existing Majetio score present — not a new score. */
  hasMajetioScore: boolean;
  /** Match / passport alignment present. */
  hasMatchScore: boolean;
  /** Location score present. */
  hasLocationScore: boolean;
  hasFinancingInputs: boolean;
  /** Technical inspection or viewing marked done in checklist. */
  conditionVerified: boolean;
  hasCriticalOpenRisk: boolean;
}): PropertyReadinessResult {
  const missingCs: string[] = [];

  if (!input.hasAskingPrice) missingCs.push("ověřená nabídková cena");
  if (!input.hasValuation) missingCs.push("odhad hodnoty (valuace)");
  if (!input.hasMajetioScore) missingCs.push("Majetio Score");
  if (!input.hasMatchScore) {
    missingCs.push("shoda s Finančním pasem (doplňte profil)");
  }
  if (!input.hasLocationScore) missingCs.push("skóre lokality");
  if (!input.hasFinancingInputs) {
    missingCs.push("financování (equity / splátka)");
  }
  if (!input.conditionVerified) {
    missingCs.push("ověření stavu (prohlídka / technická kontrola)");
  }
  if (input.hasCriticalOpenRisk) {
    missingCs.push("vyřešení kritických rizik");
  }

  const n = missingCs.length;
  const { readyMaxMissing, mediumMaxMissing } = comparisonConfig.decision;
  let status: PropertyReadinessStatus;
  if (n <= readyMaxMissing) status = "ready_for_decision";
  else if (n <= mediumMaxMissing) status = "medium";
  else status = "low";

  const headlineCs =
    missingCs.length === 0
      ? "K rozhodnutí máte většinu podkladů — finální volba zůstává na vás."
      : `K rozhodnutí vám chybí: ${missingCs.slice(0, 3).join(", ")}${
          missingCs.length > 3 ? "…" : ""
        }.`;

  return { status, missingCs, headlineCs };
}

export const READINESS_STATUS_LABELS_CS: Record<
  PropertyReadinessStatus,
  string
> = {
  low: "Nízká připravenost",
  medium: "Střední připravenost",
  ready_for_decision: "Připraveno k rozhodnutí",
};
