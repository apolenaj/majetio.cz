/**
 * Trust-by-design vocabulary — no false certainty.
 * Forbidden: "Skutečná hodnota je", "Přesná cena", "Garantovaná hodnota".
 * Preferred: "Modelovaný odhad", "Orientační rozpětí", "Nabídková cena".
 */

export const TRUST_FORBIDDEN_CERTAINTY_PHRASES = [
  "Skutečná hodnota je",
  "Přesná hodnota",
  "Garantovaná hodnota",
  "Skutečná cena nemovitosti",
] as const;

export type DataSourceKind =
  | "source_record"
  | "majetio_estimate"
  | "model_scenario"
  | "user_provided"
  | "analyst_verified";

export type ConfidenceLevel = "high" | "medium" | "low" | "insufficient";

/** Map domain valuation confidence enums to UI levels. */
export function toConfidenceLevel(
  level: string | null | undefined,
): ConfidenceLevel {
  switch ((level ?? "").toUpperCase()) {
    case "HIGH":
      return "high";
    case "MEDIUM":
      return "medium";
    case "LOW":
      return "low";
    case "INSUFFICIENT":
      return "insufficient";
    default:
      return "insufficient";
  }
}

export type DisclaimerContext =
  | "valuation"
  | "financing"
  | "yield"
  | "location"
  | "general";

export type MethodologyTopic =
  | "general"
  | "valuation"
  | "yield"
  | "score"
  | "data-sources";

export const METHODOLOGY_HREFS: Record<MethodologyTopic, string> = {
  general: "/metodika",
  valuation: "/metodika/odhad-hodnoty",
  yield: "/jak-pocitame-vynos",
  score: "/majetio-skore",
  "data-sources": "/zdroje-dat",
};
