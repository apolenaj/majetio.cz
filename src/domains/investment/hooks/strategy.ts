/**
 * Investment strategy → which key metrics to prioritize in UI.
 */

export const INVESTMENT_STRATEGIES = [
  "long_term_rental",
  "owner_occupier",
  "flip",
] as const;

export type InvestmentStrategy = (typeof INVESTMENT_STRATEGIES)[number];

export const STRATEGY_LABELS: Record<InvestmentStrategy, string> = {
  long_term_rental: "Dlouhodobý pronájem",
  owner_occupier: "Vlastní bydlení",
  flip: "Flip / rekonstrukce a prodej",
};

/** Formula keys (or synthetic keys) shown as primary result cards. */
export const STRATEGY_METRIC_KEYS: Record<
  InvestmentStrategy,
  readonly string[]
> = {
  long_term_rental: [
    "net_yield",
    "monthly_cash_flow",
    "equity_required",
    "cash_on_cash",
    "irr_placeholder",
  ],
  owner_occupier: [
    "monthly_housing_cost",
    "equity_required",
    "monthly_debt_service",
  ],
  flip: [
    "flip_profit_placeholder",
    "total_acquisition_cost",
    "flip_margin_placeholder",
    "irr_placeholder",
  ],
};

export type UiProvenanceSource =
  | "listing"
  | "majetio_estimate"
  | "hypotekajasne"
  | "user"
  | "default";

export const PROVENANCE_LABELS: Record<UiProvenanceSource, string> = {
  listing: "Z nabídky",
  majetio_estimate: "Odhad Majetio",
  hypotekajasne: "HypotekaJasne",
  user: "Uživatelský vstup",
  default: "Výchozí",
};

export function provenanceToEngineKind(
  source: UiProvenanceSource,
): "market_data" | "verified_listing" | "user_estimate" | "default_assumption" {
  switch (source) {
    case "listing":
      return "verified_listing";
    case "majetio_estimate":
    case "hypotekajasne":
      return "market_data";
    case "user":
      return "user_estimate";
    case "default":
      return "default_assumption";
  }
}
