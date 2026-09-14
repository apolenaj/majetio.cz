/**
 * Canonical ComparisonViewModel — single source for /porovnani and /porovnani/[id].
 */

export type ComparisonMode =
  | "overview"
  | "own_home"
  | "investment"
  | "financing";

export type ComparisonMetricCategoryId =
  | "basics"
  | "value"
  | "investment"
  | "financing"
  | "renovation"
  | "location"
  | "risks"
  | "match";

export type MetricDirection = "higher_better" | "lower_better" | "neutral";

export type ComparisonMetricKey =
  | "asking_price"
  | "price_per_sqm"
  | "usable_area"
  | "layout"
  | "property_type"
  | "condition"
  | "valuation_mid"
  | "asking_vs_valuation_pct"
  | "valuation_confidence"
  | "gross_yield_pct"
  | "net_yield_pct"
  | "cash_flow_monthly"
  | "estimated_rent_monthly"
  | "irr_pct"
  | "ltv_pct"
  | "loan_principal"
  | "monthly_payment"
  | "equity_required"
  | "financing_gap"
  | "renovation_cost"
  | "renovation_cost_low"
  | "renovation_cost_base"
  | "renovation_cost_high"
  | "renovation_duration"
  | "renovation_arv"
  | "max_offer"
  | "max_offer_gap"
  | "location_label"
  | "city"
  | "location_score"
  | "location_score_confidence"
  | "risk_level"
  | "risk_critical"
  | "risk_high"
  | "risk_medium"
  | "majetio_score"
  | "majetio_score_confidence"
  | "match_score"
  | "match_score_confidence"
  | "days_on_market";

export type ComparisonCellValue =
  | { kind: "number"; value: number; unit?: "czk" | "czk_per_sqm" | "pct" | "sqm" | "months" | "score" }
  | { kind: "string"; value: string }
  | { kind: "missing" };

export type ComparisonHighlight = "best" | "worst" | null;

export type ComparisonPropertyColumn = {
  propertyId: string;
  slug: string;
  title: string;
  href: string;
  imageUrl: string | null;
  isDemo: boolean;
  order: number;
  cells: Partial<Record<ComparisonMetricKey, ComparisonCellValue>>;
  /** Per-metric highlight within this comparison set. */
  highlights: Partial<Record<ComparisonMetricKey, ComparisonHighlight>>;
  /**
   * Per-metric expand detail (assumptions / confidence narrative).
   * Missing keys fall back to static EXPANDABLE blurbs in the table UI.
   */
  expandDetails: Partial<
    Record<ComparisonMetricKey, { title: string; body: string }>
  >;
  passportFinancing: {
    ltvPct: number | null;
    equityRequiredCzk: number | null;
    loanPrincipalCzk: number | null;
    monthlyPaymentCzk: number | null;
    financingGapCzk: number | null;
    usedPassport: boolean;
    note: string;
  } | null;
};

export type ComparisonMetricDefinition = {
  key: ComparisonMetricKey;
  category: ComparisonMetricCategoryId;
  labelCs: string;
  direction: MetricDirection;
  /** Modes where this metric is prioritized (shown first / emphasized). */
  priorityInModes: ComparisonMode[];
  /** When true, row can expand for assumptions / confidence detail. */
  expandable?: boolean;
};

export type ComparisonWarning = {
  id: string;
  severity: "info" | "warning";
  title: string;
  body: string;
};

export type ComparisonSummaryHighlight = {
  id: string;
  label: string;
  propertyId: string;
  propertyTitle: string;
  valueLabel: string;
};

export type ComparisonViewModel = {
  id: string | null;
  name: string | null;
  mode: ComparisonMode;
  createdAt: string | null;
  updatedAt: string | null;
  properties: ComparisonPropertyColumn[];
  metrics: ComparisonMetricDefinition[];
  /** Metrics ordered for the active mode. */
  orderedMetricKeys: ComparisonMetricKey[];
  warnings: ComparisonWarning[];
  summary: ComparisonSummaryHighlight[];
  passportApplied: boolean;
  maxProperties: number;
  unavailableLabel: string;
};

export const COMPARISON_UNAVAILABLE = "Není k dispozici";

export const COMPARISON_MODE_LABELS_CS: Record<ComparisonMode, string> = {
  overview: "Přehled",
  own_home: "Vlastní bydlení",
  investment: "Investice",
  financing: "Financování",
};

export const COMPARISON_CATEGORY_LABELS_CS: Record<
  ComparisonMetricCategoryId,
  string
> = {
  basics: "Základ",
  value: "Hodnota",
  investment: "Investice",
  financing: "Financování",
  renovation: "Rekonstrukce",
  location: "Lokalita",
  risks: "Rizika",
  match: "Shoda s profilem",
};
