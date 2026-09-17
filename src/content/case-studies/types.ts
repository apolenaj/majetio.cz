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
  /** Smluvní měsíční nájemné před neobsazeností. */
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
  /** Owner-borne SVJ / common charges — not tenant prepaid utilities. */
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
  assignment: string;
  purposeLabel: string;
  locationLabel: string;
  propertyTypeLabel: string;
  areaSqm: number;
  units?: number;
  heroImage: CaseStudyMedia;
  secondaryImages?: CaseStudyMedia[];
  purchasePriceCzk: number;
  closingCostsCzk: number;
  renovationCostCzk: number;
  /**
   * Cash reserve set aside at acquisition and included in total acquisition cost.
   * Not an annual operating expense and not double-counted in opex.
   */
  reserveCzk: number;
  /** Fixed equity; loan = max(0, TAC − equity). */
  equityCzk: number;
  loanTermYears: number;
  baseMonthlyRentCzk: number;
  baseVacancyRatePct: number;
  baseInterestRatePctPoints: number;
  opexAnnual: CaseStudyOpexAnnual;
  /**
   * Declared management fee as % of contractual rent (inkaso), if applicable.
   * Used only to verify propertyManagementCzk consistency.
   */
  managementFeePctOfContractRent?: number;
  scenarios: CaseStudyScenario[];
  inputFields: CaseStudyInputField[];
  risks: string[];
  missingDocuments: string[];
  findings: string[];
  /** Optional static notes; decision text is computed. */
  conclusionHints?: string[];
  omitMarketValue: true;
  /**
   * Target yield after vacancy on total acquisition cost (EGI / TAC).
   * Used for illustrative purchase-price solve — not an appraisal.
   */
  targetYieldAfterVacancyOnTacPct?: number;
};

export type OpexLineComputed = {
  key: keyof CaseStudyOpexAnnual;
  label: string;
  annualCzk: number;
  note: string;
};

export type CashFlowWaterfall = {
  annualContractRentCzk: number;
  vacancyLossCzk: number;
  effectiveGrossIncomeCzk: number;
  opexTotalCzk: number;
  noiCzk: number;
  annualDebtServiceCzk: number;
  annualCashFlowCzk: number;
  monthlyCashFlowCzk: number;
};

export type CaseStudyComputedScenario = {
  id: CaseStudyScenarioId;
  label: string;
  /** Inputs used for this scenario. */
  inputs: {
    monthlyContractRentCzk: number;
    vacancyRatePct: number;
    opexMultiplier: number;
    interestRatePctPoints: number;
  };
  /** Hrubý nájemní výnos = smluvní nájem / rok ÷ kupní cena. */
  grossRentalYieldOnPurchasePct: number;
  /** Výnos po neobsazenosti = efektivní hrubý příjem ÷ celkové pořizovací náklady. */
  yieldAfterVacancyOnTacPct: number;
  /** Provozní výnos = provozní výsledek (NOI) ÷ celkové pořizovací náklady. */
  operatingYieldOnTacPct: number;
  monthlyCashFlowCzk: number;
  annualCashFlowCzk: number;
  monthlyDebtServiceCzk: number;
  annualContractRentCzk: number;
  annualEgiCzk: number;
  annualNoiCzk: number;
  vacancyRatePct: number;
  interestRatePctPoints: number;
  opexLines: OpexLineComputed[];
  opexTotalCzk: number;
  waterfall: CashFlowWaterfall;
};

export type DecisionSummary = {
  coversOpsAndDebt: boolean;
  monthlyTopUpCzk: number;
  annualTopUpCzk: number;
  monthlyCashFlowCzk: number;
  annualCashFlowCzk: number;
  principalAmortizationNote: string;
  mostSensitiveAssumptions: string[];
  mustVerify: string[];
  pathToTarget: string;
  breakEvenPurchasePriceCzk: number | null;
  breakEvenAssumptions: string;
  narrative: string;
};

export type CaseStudyComputed = {
  definition: CaseStudyDefinition;
  totalAcquisitionCostCzk: number;
  otherAcquisitionCostsCzk: number;
  loanPrincipalCzk: number;
  equityRequiredCzk: number;
  financing: {
    loanPrincipalCzk: number;
    equityCzk: number;
    interestRatePctPoints: number;
    termYears: number;
    repaymentMethod: string;
    monthlyDebtServiceCzk: number;
  };
  reserveTreatment: string;
  managementFeeCheck: {
    declaredPct: number | null;
    impliedPctOfContractRent: number | null;
    matchesDeclared: boolean | null;
  };
  base: CaseStudyComputedScenario;
  scenarios: CaseStudyComputedScenario[];
  metricNotes: {
    grossRentalYieldOnPurchase: string;
    yieldAfterVacancyOnTac: string;
    operatingYieldOnTac: string;
    cashFlow: string;
    tax: string;
  };
  /**
   * Kupní cena, při které EGI / TAC = cílový výnos po neobsazenosti
   * (ostatní pořizovací náklady pevné).
   */
  priceAtTargetYieldOnTacCzk: number | null;
  targetYieldLabel: string | null;
  decision: DecisionSummary;
};
