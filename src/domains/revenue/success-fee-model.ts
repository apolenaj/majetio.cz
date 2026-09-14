/**
 * Transaction Success Fee / Purchase Concierge model (checklist 184, 215, 225).
 * Default OFF behind TRANSACTION_SUCCESS_FEE_ENABLED until legal review.
 *
 * Distinct from B2B Organization SUCCESS_FEE (broker commission share).
 */

import {
  FEATURE_FLAG_DEFAULTS,
  isTransactionSuccessFeeEnabled,
  PURCHASE_CONCIERGE_DISABLED_COPY_CS,
} from "@/config/feature-flags";

export const TRANSACTION_SUCCESS_FEE_MODEL = {
  /** Product id for legal / catalog docs. */
  productKey: "purchase_concierge" as const,
  /** Must stay false in FEATURE_FLAG_DEFAULTS. */
  defaultEnabled: FEATURE_FLAG_DEFAULTS.TRANSACTION_SUCCESS_FEE_ENABLED,
  requiresLegalReview: true,
  /**
   * Fee is on closed property transaction with concierge engagement —
   * not Majetio Score, not organic ranking.
   */
  affectsMajetioScore: false,
  affectsOrganicRanking: false,
  publicSurfaceWhenDisabled: null,
} as const;

export function getTransactionSuccessFeePublicSurface(): null | {
  enabled: true;
  labelCs: string;
  disclaimerCs: string;
} {
  if (!isTransactionSuccessFeeEnabled()) return null;
  return {
    enabled: true,
    labelCs: "Purchase Concierge",
    disclaimerCs:
      "Success fee za zastoupení při koupi — smluvní podmínky po právním rámci.",
  };
}

export function assertTransactionSuccessFeeForCheckout():
  | { ok: true }
  | { ok: false; error: string; code: "feature_disabled" } {
  if (!isTransactionSuccessFeeEnabled()) {
    return {
      ok: false,
      error: PURCHASE_CONCIERGE_DISABLED_COPY_CS.body,
      code: "feature_disabled",
    };
  }
  return { ok: true };
}

export function isTransactionSuccessFeeHiddenByDefault(): boolean {
  return TRANSACTION_SUCCESS_FEE_MODEL.defaultEnabled === false;
}
