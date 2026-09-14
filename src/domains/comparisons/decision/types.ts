/**
 * Comparison Decision Pack — structured UI payload (BOD 75–113).
 * Missing metrics use null / missing — never fake 0.
 */

export type ConfidenceLevel = "low" | "medium" | "high" | "unknown";

export type ScoredMetric = {
  /** null when unavailable — never invent 0. */
  score: number | null;
  confidence: ConfidenceLevel;
  /** 0–1 when known; null if unknown. */
  confidenceScore: number | null;
  breakdown: Array<{
    id: string;
    label: string;
    value: number | string | null;
    tone?: "positive" | "neutral" | "warning" | "negative";
  }>;
};

export type NegotiationSpaceMetrics = {
  askingPriceCzk: number | null;
  modeledMaxOfferCzk: number | null;
  /** asking − maxOffer; positive = over asking limit (need discount). */
  gapCzk: number | null;
  gapPct: number | null;
  daysOnMarket: number | null;
  recentPriceDropCzk: number | null;
  /** Czech explanation of negotiation room. */
  summaryCs: string | null;
};

export type RenovationDecisionMetrics = {
  costLowCzk: number | null;
  costBaseCzk: number | null;
  costHighCzk: number | null;
  durationDays: number | null;
  arvCzk: number | null;
  /** ARV − (asking + base renovation) when both known. */
  valueCreationCzk: number | null;
  confidence: ConfidenceLevel;
};

export type FinancingDecisionMetrics = {
  equityCzk: number | null;
  loanCzk: number | null;
  monthlyPaymentCzk: number | null;
  financingGapCzk: number | null;
  ltvPct: number | null;
  usedPersonalPassport: boolean;
  /** Always recomputed — never from public cache/snapshot. */
  private: true;
};

export type RiskSeverity = "critical" | "high" | "medium" | "low";

export type RiskDecisionItem = {
  id: string;
  title: string;
  severity: RiskSeverity;
  detail: string;
};

export type RiskDecisionSummary = {
  counts: Record<RiskSeverity, number>;
  items: RiskDecisionItem[];
  /** Highest severity present, or null when empty. */
  topSeverity: RiskSeverity | null;
};

export type PropertyNextAction = {
  id: string;
  labelCs: string;
  href: string | null;
  reasonCs: string;
};

export type DecisionCompletenessStatus =
  | "low"
  | "medium"
  | "ready_for_decision";

export type DecisionAdvice = {
  /** Never “Kupte tuto” — always advisory gaps. */
  headlineCs: string;
  missingCs: string[];
  recommendedStepCs: string | null;
};

export type PropertyPublicFingerprint = {
  propertyId: string;
  askingPriceCzk: number | null;
  status: string;
  valuationMidCzk: number | null;
  renovationBaseCzk: number | null;
  majetioScore: number | null;
  updatedAt: string;
};

export type StaleDiff = {
  propertyId: string;
  propertyTitle: string;
  field: "asking_price" | "status" | "valuation" | "renovation" | "majetio_score";
  messageCs: string;
  previous: string | number | null;
  current: string | number | null;
};

/** Public modules frozen in ComparisonSnapshot — no personal financing. */
export type ComparisonPublicPropertyMetrics = {
  propertyId: string;
  slug: string;
  title: string;
  href: string;
  isDemo: boolean;
  basics: {
    askingPriceCzk: number | null;
    pricePerSqm: number | null;
    usableArea: number | null;
    layout: string | null;
    propertyType: string | null;
    condition: string | null;
    city: string | null;
    daysOnMarket: number | null;
  };
  majetioScore: ScoredMetric;
  locationScore: ScoredMetric;
  valuation: {
    midCzk: number | null;
    lowCzk: number | null;
    highCzk: number | null;
    confidence: ConfidenceLevel;
    confidenceScore: number | null;
  };
  investment: {
    grossYieldPct: number | null;
    netYieldPct: number | null;
    cashFlowMonthlyCzk: number | null;
    estimatedRentMonthlyCzk: number | null;
    confidence: ConfidenceLevel;
  };
  negotiation: NegotiationSpaceMetrics;
  renovation: RenovationDecisionMetrics;
  risks: RiskDecisionSummary;
  fingerprint: PropertyPublicFingerprint;
};

export type ComparisonPropertyDecision = ComparisonPublicPropertyMetrics & {
  matchScore: ScoredMetric;
  financing: FinancingDecisionMetrics | null;
  nextAction: PropertyNextAction;
  completeness: DecisionCompletenessStatus;
  advice: DecisionAdvice;
};

export type ComparisonDecisionPack = {
  comparisonId: string | null;
  name: string | null;
  snapshot: {
    id: string | null;
    createdAt: string | null;
    /** ISO time of frozen metrics T. */
    metricsAt: string | null;
  };
  properties: ComparisonPropertyDecision[];
  staleDiffs: StaleDiff[];
  /** True when live data diverged from snapshot and user has not refreshed. */
  isStale: boolean;
  completeness: DecisionCompletenessStatus;
  advice: DecisionAdvice;
  /** Czech CTA for refresh — does not auto-overwrite. */
  refreshHintCs: string | null;
};
