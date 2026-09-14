/**
 * Recognize commerce RevenueEvent after payment.succeeded (ledger write).
 * Idempotent via Order id — prevents double count with entitlement grant.
 */

import { recordRevenueEvent } from "./ledger";
import { mapProductKeyToRevenueSource } from "./metrics";
import { commerceRevenueIdempotencyParts } from "./double-attribution";
import { writeMonetizationAuditLog } from "./monetization-audit";

export async function recognizeCommerceRevenueForPaidOrder(input: {
  orderId: string;
  userId: string;
  productKey: string;
  amountGrossMinor: number;
  organizationId?: string | null;
  currency?: string;
  now?: Date;
}): Promise<
  | { ok: true; revenueEventId: string; duplicatePrevented: boolean }
  | { ok: false; error: string }
> {
  if (input.amountGrossMinor <= 0) {
    return { ok: true, revenueEventId: "", duplicatePrevented: true };
  }

  const sourceType = mapProductKeyToRevenueSource(input.productKey);
  const ids = commerceRevenueIdempotencyParts(input.orderId);

  const result = await recordRevenueEvent({
    sourceType,
    sourceEntityType: ids.sourceEntityType,
    sourceEntityId: ids.sourceEntityId,
    amountGrossMinor: input.amountGrossMinor,
    userId: input.userId,
    organizationId: input.organizationId,
    orderId: input.orderId,
    currency: input.currency ?? "CZK",
    recognize: true,
    now: input.now,
    meta: {
      productKey: input.productKey,
      channel: "commerce_checkout",
    },
  });

  if (!result.ok) return result;

  if (result.created) {
    await writeMonetizationAuditLog({
      action: "revenue.commerce.recognized",
      entity: "RevenueEvent",
      entityId: result.revenueEventId,
      actorId: null,
      meta: {
        orderId: input.orderId,
        productKey: input.productKey,
        sourceType,
        amountGrossMinor: input.amountGrossMinor,
      },
    }).catch(() => undefined);

    // Product analytics only — amounts stay in RevenueEvent ledger (never in props).
    const { track } = await import("@/lib/analytics/events");
    track({
      name: "checkout_completed",
      props: {
        product_key: input.productKey,
        billing_kind: "one_time",
      },
    });
  }

  return {
    ok: true,
    revenueEventId: result.revenueEventId,
    duplicatePrevented: result.duplicatePrevented,
  };
}
