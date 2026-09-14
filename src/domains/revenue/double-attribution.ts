/**
 * Double-attribution guards (checklist 155, 156).
 * One economic fact → one RevenueEvent; multi-source leads stay in review.
 */

import { decideLeadAttribution, type AttributionTouchpoint } from "./attribution";

/**
 * Reject attempts to force a primary source when multiple compete.
 */
export function assertNoForcedDoubleAttribution(input: {
  touchpoints: AttributionTouchpoint[];
  proposedPrimarySourceKey?: string | null;
  windowDays?: number;
  anchorAt?: Date;
}):
  | { ok: true; decision: ReturnType<typeof decideLeadAttribution> }
  | { ok: false; error: string; code: "multi_source" | "mismatch" } {
  const decision = decideLeadAttribution({
    touchpoints: input.touchpoints,
    windowDays: input.windowDays,
    anchorAt: input.anchorAt,
  });

  if (decision.status === "MULTI_SOURCE_REVIEW") {
    if (input.proposedPrimarySourceKey) {
      return {
        ok: false,
        error:
          "Nelze automaticky přiřadit primary source při více konkurenčních zdrojích (155/156).",
        code: "multi_source",
      };
    }
    return { ok: true, decision };
  }

  if (
    input.proposedPrimarySourceKey &&
    decision.primarySourceKey &&
    input.proposedPrimarySourceKey !== decision.primarySourceKey
  ) {
    return {
      ok: false,
      error: "Navržený primary source neodpovídá decision engine.",
      code: "mismatch",
    };
  }

  return { ok: true, decision };
}

/**
 * Commerce: one Order → at most one revenue recognition key.
 */
export function commerceRevenueEntityId(orderId: string): string {
  return orderId;
}

export function commerceRevenueIdempotencyParts(orderId: string): {
  sourceEntityType: "Order";
  sourceEntityId: string;
} {
  return {
    sourceEntityType: "Order",
    sourceEntityId: commerceRevenueEntityId(orderId),
  };
}
