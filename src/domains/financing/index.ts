/**
 * Financing domain — client-safe façade (pure calculators + catalogs).
 *
 * Server-only mortgage offer cache / HJ ingestion live in:
 *   `@/domains/financing/service/mortgage-rates`
 * Do NOT re-export them here — client components import this barrel.
 */

export type {
  CanonicalMortgageOffer,
  MortgageFreshness,
} from "@/integrations/hypotekajasne/schemas";

export {
  propertyFinancingInputSchema,
  calculatePropertyFinancing,
  buildFinancingScenarios,
  offerToFinancingOverrides,
  type PropertyFinancingInput,
  type PropertyFinancingSummary,
  type FinancingScenario,
  type FinancingScenarioKind,
  type FinancingRateTier,
} from "./property-financing";

export {
  buildFinancingRateSensitivity,
  buildMortgageOfferComparison,
  buildMortgageOfferTermsUrl,
  filterDisplayableMortgageOffers,
  formatOfferRatePp,
  offerFreshness,
  sortMortgageOffers,
  MORTGAGE_OFFER_SORT_LABELS,
  type MortgageOfferSortKey,
  type MortgageOfferComparisonRow,
  type FinancingRateSensitivityRow,
} from "./mortgage-offer-catalog";

export {
  MORTGAGE_READINESS_LEVELS,
  computeMortgageReadiness,
  buildReadinessInputFromPassport,
  applyScenarioOverride,
  type MortgageReadinessLevel,
  type MortgageReadiness,
  type MortgageReadinessInput,
  type ChecklistItem,
  type ChecklistItemId,
  type ChecklistItemStatus,
  type PassportScenarioOverride,
} from "./mortgage-readiness";

export {
  resolveActiveMortgageRegulatoryConfig,
  getApplicableMaxLtvPct,
} from "./regulatory/regulatory-config";

export {
  evaluateLtvScenarioMatch,
  type LtvScenarioAssessment,
} from "./regulatory/ltv-scenario-match";

export {
  computeOrientationalMortgageReadiness,
  type OrientationalMortgageReadiness,
} from "./regulatory/orientational-readiness";

export {
  FINANCING_PROVIDERS,
  listFinancingProvidersForMarket,
  resolveFinancingProvider,
  resolveFinancingLeadRouting,
  assertHypotekaJasneCzOnly,
  type FinancingProvider,
  type FinancingProviderResolution,
  type FinancingProviderKind,
} from "./providers/registry";
