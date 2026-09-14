/**
 * Confidence score from input provenance (data vs user estimates).
 */

import { bindFormula, type FormulaBound } from "../calculations/helpers";

export const INPUT_PROVENANCE_KINDS = [
  "market_data",
  "verified_listing",
  "user_estimate",
  "default_assumption",
  "missing",
] as const;

export type InputProvenanceKind = (typeof INPUT_PROVENANCE_KINDS)[number];

/** Quality points 0–100 per provenance kind. */
export const PROVENANCE_QUALITY: Record<InputProvenanceKind, number> = {
  market_data: 95,
  verified_listing: 85,
  user_estimate: 55,
  default_assumption: 35,
  missing: 0,
};

export type InputFieldProvenance = {
  field: string;
  provenance: InputProvenanceKind;
  /** Optional weight (default 1). Critical fields can be heavier. */
  weight?: number;
};

export type ConfidenceScoreResult = FormulaBound<number> & {
  level: "high" | "medium" | "low" | "insufficient";
  fields: InputFieldProvenance[];
  explanation: string[];
};

function levelFromScore(score: number): ConfidenceScoreResult["level"] {
  if (score <= 0) return "insufficient";
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

/**
 * Weighted average of provenance qualities → 0–100 confidence.
 */
export function calculateConfidenceScore(
  fields: InputFieldProvenance[],
): ConfidenceScoreResult {
  const explanations: string[] = [];
  if (fields.length === 0) {
    return {
      ...bindFormula("confidence_score", 0),
      level: "insufficient",
      fields: [],
      explanation: ["Žádná provenance polí — confidence nelze spočítat"],
    };
  }

  let weighted = 0;
  let totalWeight = 0;
  for (const f of fields) {
    const w = f.weight ?? 1;
    const q = PROVENANCE_QUALITY[f.provenance];
    weighted += q * w;
    totalWeight += w;
    if (f.provenance === "user_estimate" || f.provenance === "default_assumption") {
      explanations.push(
        `${f.field}: ${f.provenance} (kvalita ${q})`,
      );
    }
    if (f.provenance === "missing") {
      explanations.push(`${f.field}: chybí vstup`);
    }
  }

  const score = Math.round((weighted / totalWeight) * 10) / 10;
  const level = levelFromScore(score);
  if (explanations.length === 0) {
    explanations.push("Vstupy převážně z ověřených / tržních zdrojů");
  }

  return {
    ...bindFormula("confidence_score", score),
    level,
    fields,
    explanation: explanations,
  };
}
