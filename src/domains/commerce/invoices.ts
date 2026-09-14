/**
 * Automated tax invoice stubs — LEGAL_REVIEW (checklist 215).
 * Default OFF behind AUTOMATED_INVOICE_ENABLED.
 */

import { isFeatureEnabled } from "@/config/feature-flags";
import { LEGAL_REVIEW_MARKER } from "@/config/legal-review";

/** @LEGAL_REVIEW — fiscal invoice generation requires accounting sign-off. */
export const AUTOMATED_INVOICE_STATUS = {
  marker: LEGAL_REVIEW_MARKER,
  domain: "invoices" as const,
  checklist: [215],
  defaultEnabled: false,
  copyCs: {
    unavailable:
      "Automatické daňové doklady zatím nejsou generovány — billing údaje se ukládají, fakturace po accounting review.",
  },
} as const;

export function isAutomatedInvoiceEnabled(): boolean {
  return isFeatureEnabled("AUTOMATED_INVOICE_ENABLED");
}

export function assertAutomatedInvoiceEnabled():
  | { ok: true }
  | { ok: false; error: string; code: "feature_disabled" } {
  if (!isAutomatedInvoiceEnabled()) {
    return {
      ok: false,
      error: AUTOMATED_INVOICE_STATUS.copyCs.unavailable,
      code: "feature_disabled",
    };
  }
  return { ok: true };
}

/**
 * Placeholder — never emits a fiscal document while flag is OFF.
 */
export async function generateTaxInvoice(_input: {
  orderId: string;
}): Promise<
  | { ok: false; error: string; code: "feature_disabled" }
  | { ok: true; invoiceId: string }
> {
  void _input;
  const gate = assertAutomatedInvoiceEnabled();
  if (!gate.ok) return gate;
  return {
    ok: false,
    error: "Invoice generator not implemented — awaiting accounting review.",
    code: "feature_disabled",
  };
}
