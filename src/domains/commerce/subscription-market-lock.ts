/**
 * Subscription / entitlement market immutability (Rule 162).
 * Changing UserMarketProfile must NOT auto-mutate existing subscriptions.
 */

export type SubscriptionMarketLock = {
  subscriptionId: string;
  /** Market of the PricingPlan that sold this subscription. */
  billingMarketCode: string;
  currency: string;
  pricingPlanKey: string;
  pricingPlanVersionKey: string;
};

export class SubscriptionMarketChangeError extends Error {
  readonly code = "SUBSCRIPTION_MARKET_IMMUTABLE" as const;

  constructor(message: string) {
    super(message);
    this.name = "SubscriptionMarketChangeError";
  }
}

/**
 * Preference / UI market switch must not rewrite billing.
 * Existing subscription stays on its original plan until explicit re-checkout.
 */
export function assertSubscriptionUnchangedOnMarketSwitch(input: {
  existing: SubscriptionMarketLock | null | undefined;
  newPreferredMarketCode: string;
}): {
  action: "KEEP_EXISTING_SUBSCRIPTION" | "NO_SUBSCRIPTION";
  note: string;
} {
  if (!input.existing) {
    return {
      action: "NO_SUBSCRIPTION",
      note: "No active subscription — market preference may change freely.",
    };
  }

  const billing = input.existing.billingMarketCode.toUpperCase();
  const next = input.newPreferredMarketCode.toUpperCase();

  if (billing !== next) {
    // Explicit non-mutation: caller must NOT update PricingPlan / entitlement market.
    return {
      action: "KEEP_EXISTING_SUBSCRIPTION",
      note: `Subscription ${input.existing.subscriptionId} remains on market ${billing} / ${input.existing.currency}. New preference ${next} does not reprice or migrate billing automatically.`,
    };
  }

  return {
    action: "KEEP_EXISTING_SUBSCRIPTION",
    note: "Preferred market matches billing market — no change.",
  };
}

/**
 * Checkout guard: refuse paying a plan whose market ≠ intended checkout market.
 */
export function assertPricingPlanMarketMatch(input: {
  planMarketCode: string;
  checkoutMarketCode: string;
}): void {
  if (
    input.planMarketCode.toUpperCase() !==
    input.checkoutMarketCode.toUpperCase()
  ) {
    throw new SubscriptionMarketChangeError(
      `PricingPlan market ${input.planMarketCode} does not match checkout market ${input.checkoutMarketCode}.`,
    );
  }
}
