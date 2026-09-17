/**
 * Model case studies for public marketing — not live listings or market averages.
 */

export type CaseStudySlug =
  | "byt-dlouhodoby-pronajem"
  | "dum-pred-rekonstrukci"
  | "mensi-bytovy-dum";

export type InputProvenance = "stated" | "documented" | "model_assumption";

export type CaseStudyInputField = {
  label: string;
  value: string;
  provenance: InputProvenance;
};

export type CaseStudyScenarioId = "conservative" | "base" | "favorable";

export type CaseStudyScenario = {
  id: CaseStudyScenarioId;
  label: string;
  /** Monthly rent after vacancy adjustment (model). */
  monthlyRentEffectiveCzk: number;
  vacancyRatePct: number;
  /** Multiplier applied to base opex (e.g. 1.15 conservative). */
  opexMultiplier: number;
  interestRatePctPoints: number;
};

export type CaseStudyOpexAnnual = {
  propertyManagementCzk: number;
  maintenanceCzk: number;
  insuranceCzk: number;
  propertyTaxCzk: number;
  svjOwnerCostCzk: number;
};

export type CaseStudyMedia = {
  src: string;
  alt: string;
  caption: string;
  kind: "illustration" | "ai_visualization";
  width: number;
  height: number;
};

export type CaseStudyDefinition = {
  slug: CaseStudySlug;
  title: string;
  shortTitle: string;
  /** One-line assignment shown on cards. */
  assignment: string;
  purposeLabel: string;
  locationLabel: string;
  propertyTypeLabel: string;
  areaSqm: number;
  units?: number;
  heroImage: CaseStudyMedia;
  secondaryImages?: CaseStudyMedia[];
  /** Purchase price — stated model input, not a market valuation. */
  purchasePriceCzk: number;
  closingCostsCzk: number;
  renovationCostCzk: number;
  reserveCzk: number;
  equityCzk: number;
  loanTermYears: number;
  /** Base-case monthly contract rent before vacancy. */
  baseMonthlyRentCzk: number;
  baseVacancyRatePct: number;
  baseInterestRatePctPoints: number;
  opexAnnual: CaseStudyOpexAnnual;
  scenarios: CaseStudyScenario[];
  inputFields: CaseStudyInputField[];
  risks: string[];
  missingDocuments: string[];
  findings: string[];
  conclusion: string;
  /** If true, do not show a fabricated market value. */
  omitMarketValue: true;
  /**
   * Optional: purchase price at which base-case gross yield hits this target.
   * Explained as target-yield price, not appraisal.
   */
  targetGrossYieldPct?: number;
};

export type CaseStudyComputedScenario = {
  id: CaseStudyScenarioId;
  label: string;
  grossYieldPct: number;
  operatingYieldPct: number;
  monthlyCashFlowCzk: number;
  monthlyDebtServiceCzk: number;
  annualEgiCzk: number;
  annualNoiCzk: number;
  vacancyRatePct: number;
  interestRatePctPoints: number;
};

export type CaseStudyComputed = {
  definition: CaseStudyDefinition;
  totalAcquisitionCostCzk: number;
  loanPrincipalCzk: number;
  equityRequiredCzk: number;
  /** Pre-tax results; bases documented in metricNotes. */
  base: CaseStudyComputedScenario;
  scenarios: CaseStudyComputedScenario[];
  metricNotes: {
    grossYield: string;
    operatingYield: string;
    cashFlow: string;
    tax: string;
  };
  priceAtTargetGrossYieldCzk: number | null;
};
