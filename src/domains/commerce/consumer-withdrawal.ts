/**
 * Consumer withdrawal stubs — LEGAL_REVIEW (checklist 213).
 * Public flow stays behind CONSUMER_WITHDRAWAL_ENABLED (default OFF).
 */

import { isFeatureEnabled } from "@/config/feature-flags";
import { LEGAL_REVIEW_MARKER } from "@/config/legal-review";

/** @LEGAL_REVIEW — do not expose withdrawal UX until legal copy is approved. */
export const CONSUMER_WITHDRAWAL_STATUS = {
  marker: LEGAL_REVIEW_MARKER,
  domain: "consumer_withdrawal" as const,
  checklist: [213],
  defaultEnabled: false,
  copyCs: {
    unavailable:
      "Automatické odstoupení od smlouvy pro digitální obsah zatím není spuštěno — po právním review.",
    digitalContentNote:
      "U digitálního obsahu může být odstoupení omezeno po zahájení plnění se souhlasem spotřebitele.",
  },
} as const;

export function isConsumerWithdrawalEnabled(): boolean {
  return isFeatureEnabled("CONSUMER_WITHDRAWAL_ENABLED");
}

export function assertConsumerWithdrawalEnabled():
  | { ok: true }
  | { ok: false; error: string; code: "feature_disabled" } {
  if (!isConsumerWithdrawalEnabled()) {
    return {
      ok: false,
      error: CONSUMER_WITHDRAWAL_STATUS.copyCs.unavailable,
      code: "feature_disabled",
    };
  }
  return { ok: true };
}
