/**
 * Guardrails — prohibited scoring inputs and categories.
 * STRICT: no demographic, ethnic, or social-structure-based ratings.
 */

export const PROHIBITED_SCORE_CATEGORIES = [
  "DEMOGRAPHIC_COMPOSITION",
  "ETHNICITY",
  "SOCIAL_STRUCTURE",
  "CRIME_RATE_POPULATION",
  "SAFETY_SCORE",
  "NEIGHBORHOOD_REPUTATION",
  "SUBJECTIVE_QUALITY_OF_LIFE",
] as const;

export type ProhibitedScoreCategory = (typeof PROHIBITED_SCORE_CATEGORIES)[number];

export class ProhibitedScoreInputError extends Error {
  constructor(public readonly category: ProhibitedScoreCategory) {
    super(
      `Prohibited score input: ${category}. Majetio does not score people or demographic composition.`,
    );
    this.name = "ProhibitedScoreInputError";
  }
}

const PROHIBITED_PATTERNS = [
  /demograph/i,
  /etnic/i,
  /ethnic/i,
  /crime.*rate/i,
  /bezpecnost.*skore/i,
  /safety.*score/i,
  /social.*structure/i,
  /income.*level.*neighborhood/i,
  /population.*density.*score/i,
] as const;

export function assertAllowedScoreInput(key: string): void {
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(key)) {
      throw new ProhibitedScoreInputError("SAFETY_SCORE");
    }
  }

  for (const cat of PROHIBITED_SCORE_CATEGORIES) {
    if (key.toUpperCase().includes(cat)) {
      throw new ProhibitedScoreInputError(cat);
    }
  }
}

export function sanitizeRawInputs(
  inputs: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(inputs)) {
    assertAllowedScoreInput(key);
    out[key] = value;
  }
  return out;
}

export const SCORE_DISCLAIMERS = [
  "Skóre lokality není investičním doporučením.",
  "Nehodnotíme demografické složení, etnicitu ani subjektivní „bezpečnost obyvatel“.",
  "Používáme pouze agregovaná oficiální data a transparentní pravidla.",
  "Chybějící data znamenají „nedostupné“ — nikdy 0.",
] as const;
