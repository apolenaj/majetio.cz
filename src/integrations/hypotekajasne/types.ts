/**
 * Shared contracts for Majetio ↔ HypotekaJasne.
 * Canonical models live in ./schemas — not HypotekaJasne wire format.
 */

export type { HypotekaJasneClient } from "./client/interface";

export {
  financingPreviewRequestSchema,
  financingPreviewResponseSchema,
  handoffLeadRequestSchema,
  handoffLeadResponseSchema,
  type FinancingPreviewRequest,
  type FinancingPreviewResponse,
  type HandoffLeadRequest,
  type HandoffLeadResponse,
} from "./schemas/legacy";

export {
  canonicalMortgageOfferSchema,
  type CanonicalMortgageOffer,
  type MortgageOfferStatus,
  type MortgageDataTier,
  type MortgageFreshness,
} from "./schemas/mortgage-offer";
