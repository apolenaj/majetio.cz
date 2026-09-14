/**
 * Commerce quote builder — PricingPlan + Promotion → line snapshot inputs.
 */

import { splitGrossVat, type CommerceCurrency } from "@/config/commerce";
import type { PublicPricingPlan } from "./catalog";
import {
  computePromotionDiscount,
  type ResolvedPromotion,
} from "./promotions";

export type CommerceLineQuote = {
  planKey: string;
  planVersionKey: string;
  planName: string;
  billingType: PublicPricingPlan["billingType"];
  pricingPlanId: string | null;
  currency: CommerceCurrency;
  vatRateBp: number;
  quantity: number;
  unitListGrossMinor: number;
  discountMinor: number;
  unitPriceGrossMinor: number;
  unitPriceNetMinor: number;
  unitPriceVatMinor: number;
  lineGrossMinor: number;
  lineNetMinor: number;
  lineVatMinor: number;
  limitsSnapshot: PublicPricingPlan["limits"];
  featuresSnapshot: string[];
  promoCode: string | null;
};

export function buildCommerceLineQuote(input: {
  plan: PublicPricingPlan & { rowId?: string | null };
  quantity?: number;
  promotion?: ResolvedPromotion | null;
  now?: Date;
}): CommerceLineQuote | { error: string } {
  const qty = Math.max(1, Math.round(input.quantity ?? 1));
  const list = Math.max(0, Math.round(input.plan.priceGrossMinor));
  const applied = computePromotionDiscount({
    listGrossMinor: list,
    planKey: input.plan.key,
    promotion: input.promotion ?? null,
    now: input.now,
  });
  if (applied.error && input.promotion) {
    return { error: applied.error };
  }

  const unitGross = applied.grossMinor;
  const split = splitGrossVat({
    grossMinor: unitGross,
    vatRateBp: input.plan.vatRateBp,
  });
  const lineGross = unitGross * qty;
  const lineSplit = splitGrossVat({
    grossMinor: lineGross,
    vatRateBp: input.plan.vatRateBp,
  });

  return {
    planKey: input.plan.key,
    planVersionKey: input.plan.versionKey,
    planName: input.plan.name,
    billingType: input.plan.billingType,
    pricingPlanId: input.plan.rowId ?? (input.plan.id.startsWith("fallback_") ? null : input.plan.id),
    currency: input.plan.currency,
    vatRateBp: input.plan.vatRateBp,
    quantity: qty,
    unitListGrossMinor: list,
    discountMinor: applied.discountMinor * qty,
    unitPriceGrossMinor: split.grossMinor,
    unitPriceNetMinor: split.netMinor,
    unitPriceVatMinor: split.vatMinor,
    lineGrossMinor: lineSplit.grossMinor,
    lineNetMinor: lineSplit.netMinor,
    lineVatMinor: lineSplit.vatMinor,
    limitsSnapshot: input.plan.limits,
    featuresSnapshot: input.plan.features,
    promoCode: input.promotion?.code ?? null,
  };
}
